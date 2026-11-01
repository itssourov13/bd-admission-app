import type { SqlDb } from "../db/types.ts";
import { migrate } from "../db/schema.ts";
import { ensureProfile } from "../repositories/userData.ts";
import { closeStaleFlash } from "../repositories/sessions.ts";
import { finalizeOverdueExam } from "./practiceService.ts";
import { hasImportedBatches, syncBundledPacks } from "./contentSync.ts";
import { libraryWithin, overallFraction, type StartupProgress } from "./startupProgress.ts";

export interface StartupHooks {
  /** Publishes a progress patch (stage changes and real counters). */
  report(patch: Partial<StartupProgress>): void;
  /** Lets the UI paint between heavy steps. May be a no-op in tests. */
  yieldToUi(): Promise<void>;
  /** Resolves after the branded setup screen has completed its first layout. */
  waitForSetupScreen?: () => Promise<void>;
  /** Loads the bundled question packs after the setup screen is visible. */
  loadPacks(): Promise<readonly unknown[]>;
  now?: number;
}

export interface StartupResult {
  /** Non-blocking content warnings (a failed pack, or a failed sync on an already-populated database). */
  importIssues: string[];
  /** True when this database had never had content imported before. */
  firstRun: boolean;
}

/**
 * Startup sequence once SQLite is open: migrations, app-data housekeeping, then bundled question-pack sync.
 * Order and behaviour match what DbProvider did before the setup screen existed; progress reports were added.
 *
 * Failure policy:
 *  - migration / housekeeping errors throw (the caller shows the retry screen; no data is deleted);
 *  - individual pack failures are warnings;
 *  - on a first launch, a sync that throws, or that leaves no usable pack at all, also throws so the user can retry
 *    instead of landing on an empty app. Retrying resumes cheaply because unchanged packs are skipped by signature.
 *  - on an already-populated database a sync failure stays a warning and the app opens with the existing content.
 */
export async function runStartup(db: SqlDb, hooks: StartupHooks): Promise<StartupResult> {
  const now = hooks.now ?? Date.now();

  await migrate(db);

  hooks.report({ stage: "appData", fraction: overallFraction("appData") });
  await hooks.yieldToUi();
  await ensureProfile(db, now);
  await closeStaleFlash(db, now);
  await finalizeOverdueExam(db, now);
  const firstRun = !(await hasImportedBatches(db));

  hooks.report({ stage: "library", mode: firstRun ? "firstRun" : "returning", fraction: overallFraction("library") });
  await hooks.waitForSetupScreen?.();
  await hooks.yieldToUi();

  const importIssues: string[] = [];
  try {
    const packs = await hooks.loadPacks();
    hooks.report({ packsTotal: packs.length });
    const outcomes = await syncBundledPacks(db, packs, now, async (p) => {
      hooks.report({
        packsDone: p.index,
        packsTotal: p.total,
        fraction: overallFraction("library", libraryWithin(p.index, p.total, p.questionsDone, p.questionsTotal))
      });
      await hooks.yieldToUi();
    });
    let usable = 0;
    for (const o of outcomes) {
      if (o.status === "failed") importIssues.push(`${o.batchId ?? "pack"}: ${o.errors.slice(0, 3).join("; ")}`);
      else usable++;
    }
    if (firstRun && packs.length > 0 && usable === 0) {
      throw new Error("None of the bundled question packs could be imported.");
    }
  } catch (error) {
    if (firstRun) throw error;
    importIssues.push(error instanceof Error ? error.message : String(error));
  }

  hooks.report({ stage: "finalizing", fraction: overallFraction("finalizing") });
  await hooks.yieldToUi();
  return { importIssues, firstRun };
}

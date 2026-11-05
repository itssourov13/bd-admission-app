import type { SqlDb } from "../db/types.ts";
import { migrate } from "../db/schema.ts";
import { ensureProfile } from "../repositories/userData.ts";
import { closeStaleFlash } from "../repositories/sessions.ts";
import { finalizeOverdueExam } from "./practiceService.ts";
import { hasImportedBatches, syncBundledPacks, type SyncOutcome, type SyncProgressListener } from "./contentSync.ts";
import { NOOP_METRICS, type StartupMetrics } from "./perf.ts";
import { libraryWithin, overallFraction, type StartupProgress } from "./startupProgress.ts";

export interface StartupHooks {
  /** Publishes a progress patch (stage changes and real counters). */
  report(patch: Partial<StartupProgress>): void;
  /** Lets the UI paint between heavy steps. May be a no-op in tests. */
  yieldToUi(): Promise<void>;
  /** Resolves after the branded setup screen has completed its first layout. */
  waitForSetupScreen?: () => Promise<void>;
  /**
   * Brings the database up to the bundled content (the production path: pre-built seed, see services/seedSync.ts).
   * Must report real per-pack progress through `onProgress` and resolve with one outcome per bundled pack.
   */
  syncContent?(db: SqlDb, onProgress: SyncProgressListener, now: number): Promise<SyncOutcome[]>;
  /** Legacy path (per-row importer), kept for tests, the benchmark and tooling. Ignored when `syncContent` is set. */
  loadPacks?(): Promise<readonly unknown[]>;
  /** Startup timings and counters. Defaults to a no-op sink. */
  metrics?: StartupMetrics;
  now?: number;
}

export interface StartupResult {
  /** Non-blocking content warnings (a failed pack, or a failed sync on an already-populated database). */
  importIssues: string[];
  /** True when this database had never had content imported before. */
  firstRun: boolean;
  /** True only when every bundled pack is present with its current signature. False means the next launch retries the rest. */
  libraryComplete: boolean;
}

/**
 * Startup sequence once SQLite is open: migrations, app-data housekeeping, then bundled content sync.
 *
 * Failure policy:
 *  - migration / housekeeping errors throw (the caller shows the retry screen; no data is deleted);
 *  - individual pack failures are warnings;
 *  - on a first launch, a sync that throws, or that leaves no usable pack at all, also throws so the user can retry
 *    instead of landing on an empty app. Retrying resumes cheaply: every pack that committed keeps its signature
 *    (the durable checkpoint) and is skipped.
 *  - on an already-populated database a sync failure stays a warning and the app opens with the existing content.
 *  - an incomplete library is never reported as initialized: a failed pack stays "failed" in `importIssues` and is
 *    retried on the next launch because its signature was never committed.
 */
export async function runStartup(db: SqlDb, hooks: StartupHooks): Promise<StartupResult> {
  const now = hooks.now ?? Date.now();
  const metrics = hooks.metrics ?? NOOP_METRICS;

  await metrics.span("db.migrate", () => migrate(db));

  hooks.report({ stage: "appData", fraction: overallFraction("appData") });
  await hooks.yieldToUi();
  await metrics.span("db.appData", async () => {
    await ensureProfile(db, now);
    await closeStaleFlash(db, now);
    await finalizeOverdueExam(db, now);
  });
  const firstRun = !(await metrics.span("db.firstRunCheck", () => hasImportedBatches(db)));
  metrics.mark(firstRun ? "firstRun" : "returning");

  hooks.report({ stage: "library", mode: firstRun ? "firstRun" : "returning", fraction: overallFraction("library") });
  await hooks.waitForSetupScreen?.();
  await hooks.yieldToUi();

  const importIssues: string[] = [];
  let libraryComplete = false;
  try {
    const onProgress: SyncProgressListener = async (p) => {
      hooks.report({
        packsDone: p.index,
        packsTotal: p.total,
        fraction: overallFraction("library", libraryWithin(p.index, p.total, p.questionsDone, p.questionsTotal))
      });
      await hooks.yieldToUi();
    };

    let outcomes: SyncOutcome[];
    if (hooks.syncContent) {
      outcomes = await metrics.span("content.sync", () => hooks.syncContent!(db, onProgress, now));
    } else {
      const packs = await metrics.span("content.load", () => hooks.loadPacks?.() ?? Promise.resolve([] as readonly unknown[]));
      hooks.report({ packsTotal: packs.length });
      outcomes = await metrics.span("content.sync", () => syncBundledPacks(db, packs, now, onProgress, metrics));
    }

    let usable = 0;
    for (const o of outcomes) {
      if (o.status === "failed") importIssues.push(`${o.batchId ?? "pack"}: ${o.errors.slice(0, 3).join("; ")}`);
      else usable++;
    }
    metrics.count("content.packs.usable", usable);
    libraryComplete = usable === outcomes.length;
    if (firstRun && outcomes.length > 0 && usable === 0) {
      throw new Error("None of the bundled question packs could be imported.");
    }
  } catch (error) {
    if (firstRun) throw error;
    importIssues.push(error instanceof Error ? error.message : String(error));
  }

  hooks.report({ stage: "finalizing", fraction: overallFraction("finalizing") });
  await hooks.yieldToUi();
  return { importIssues, firstRun, libraryComplete };
}

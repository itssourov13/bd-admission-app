/**
 * Single-flight startup coordination and app-lifecycle reconciliation. No React Native imports (the provider feeds it
 * AppState transitions), so every rule below is covered by `node --test`.
 *
 * Guarantees:
 *  - At most ONE startup attempt runs at a time. `start()`, `retry()`, StrictMode double effects and foreground
 *    auto-resume all join the in-flight attempt instead of opening a second writer on the database.
 *  - An attempt that FAILED while the app was backgrounded (the OS may have frozen or throttled the process, closed
 *    the database handle, or interrupted a transaction) is resumed automatically when the app returns to the
 *    foreground, whether the transition happens just before or just after the Promise rejects, at most
 *    `maxAutoResumes` times. Resuming is safe: content work is checkpointed transactionally.
 *  - A failure while the app stayed in the foreground is never auto-retried; the user sees the retry screen.
 *  - A successful result is remembered; later calls return it without running again.
 *
 * Non-goals: this does not keep the process alive or run work while the app is suspended. Android decides that;
 * see docs/STARTUP_PERFORMANCE.md.
 */

export type AppLifecycle = "active" | "inactive" | "background";

export type AttemptOutcome<T> = { ok: true; value: T } | { ok: false; error: Error };

export interface StartupCoordinatorOptions<T> {
  /** One complete startup attempt (open database, migrate, sync content). Must release its own resources on failure. */
  runAttempt(info: { attempt: number; resumed: boolean }): Promise<T>;
  /** Called when an attempt begins (UI goes back to the loading state). */
  onAttemptStart?(info: { attempt: number; resumed: boolean }): void;
  /** Called when an attempt settles. */
  onSettled?(outcome: AttemptOutcome<T>, info: { attempt: number; resumed: boolean }): void;
  /** Cap on automatic foreground resumes after background failures. Default 2. */
  maxAutoResumes?: number;
  initialLifecycle?: AppLifecycle;
}

export interface StartupCoordinatorState {
  status: "idle" | "running" | "succeeded" | "failed";
  attempts: number;
  autoResumes: number;
  lifecycle: AppLifecycle;
  /** True when the app left the foreground at any point during the current/last attempt. */
  backgroundedDuringAttempt: boolean;
}

export interface StartupCoordinator<T> {
  /** Starts the first attempt, or joins the running one, or returns the stored success. */
  start(): Promise<AttemptOutcome<T>>;
  /** User-initiated retry. Joins a running attempt; otherwise starts a fresh one and resets the auto-resume budget. */
  retry(): Promise<AttemptOutcome<T>>;
  /** Feed AppState transitions here. */
  setLifecycle(next: AppLifecycle): void;
  getState(): StartupCoordinatorState;
}

export function createStartupCoordinator<T>(options: StartupCoordinatorOptions<T>): StartupCoordinator<T> {
  const maxAutoResumes = options.maxAutoResumes ?? 2;
  let lifecycle: AppLifecycle = options.initialLifecycle ?? "active";
  let status: StartupCoordinatorState["status"] = "idle";
  let attempts = 0;
  let autoResumes = 0;
  let backgrounded = false;
  let inflight: Promise<AttemptOutcome<T>> | null = null;
  let last: AttemptOutcome<T> | null = null;

  const begin = (resumed: boolean): Promise<AttemptOutcome<T>> => {
    attempts += 1;
    const info = { attempt: attempts, resumed };
    status = "running";
    backgrounded = lifecycle !== "active";
    options.onAttemptStart?.(info);
    const run = (async (): Promise<AttemptOutcome<T>> => {
      let outcome: AttemptOutcome<T>;
      try {
        outcome = { ok: true, value: await options.runAttempt(info) };
      } catch (error) {
        outcome = { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
      }
      last = outcome;
      status = outcome.ok ? "succeeded" : "failed";
      inflight = null;
      options.onSettled?.(outcome, info);

      // AppState may return to active BEFORE a slow/rejected JS promise settles. In that ordering the
      // foreground transition could not resume the in-flight attempt, so reconcile it here instead.
      if (!outcome.ok && lifecycle === "active" && backgrounded && autoResumes < maxAutoResumes) {
        autoResumes += 1;
        void begin(true);
      }
      return outcome;
    })();
    inflight = run;
    return run;
  };

  return {
    start() {
      if (inflight) return inflight;
      if (last?.ok) return Promise.resolve(last);
      return begin(false);
    },
    retry() {
      if (inflight) return inflight;
      autoResumes = 0;
      return begin(false);
    },
    setLifecycle(next) {
      const previous = lifecycle;
      lifecycle = next;
      if (next !== "active" && inflight) backgrounded = true;
      if (next === "active" && previous !== "active" && !inflight && status === "failed" && backgrounded && autoResumes < maxAutoResumes) {
        autoResumes += 1;
        void begin(true);
      }
    },
    getState() {
      return { status, attempts, autoResumes, lifecycle, backgroundedDuringAttempt: backgrounded };
    }
  };
}

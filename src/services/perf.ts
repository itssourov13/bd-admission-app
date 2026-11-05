/**
 * Startup performance instrumentation. No React Native imports, so it runs under `node --test` and in build scripts.
 *
 * - Durations use a monotonic clock (`performance.now()`, never `Date.now()`), so wall-clock changes cannot skew them.
 * - Only metric names and numbers are recorded: never question text, profile data or any other user data.
 * - Spans accumulate (total ms, calls, slowest call) so per-pack work is cheap to record and still diagnosable.
 */

export interface SpanStat {
  ms: number;
  calls: number;
  maxMs: number;
}

export interface StartupMetricsSnapshot {
  /** Milliseconds from metrics creation (or the last reset) to the snapshot. */
  elapsedMs: number;
  spans: Record<string, SpanStat>;
  counters: Record<string, number>;
  /** Milliseconds from creation/reset to the first time each mark was set. */
  marks: Record<string, number>;
}

export interface StartupMetrics {
  /** Monotonic milliseconds. */
  now(): number;
  /** Records the elapsed time since creation/reset for `name`. The first call wins. */
  mark(name: string): void;
  count(name: string, n?: number): void;
  addSpan(name: string, ms: number): void;
  /** Times an async function. Duration is recorded even when it throws. */
  span<T>(name: string, fn: () => Promise<T>): Promise<T>;
  /** Times a synchronous function. */
  time<T>(name: string, fn: () => T): T;
  snapshot(): StartupMetricsSnapshot;
  /** One compact line, suitable for a single log statement. */
  summary(): string;
  /** Starts a new attempt measurement window; process-relative marks remain available across retries. */
  reset(): void;
}

/** Monotonic millisecond clock. `performance.now()` exists in Hermes and Node; the fallback keeps odd runtimes working. */
export function monotonicNow(): number {
  const perf = (globalThis as { performance?: { now?: () => number } }).performance;
  return typeof perf?.now === "function" ? perf.now() : Date.now();
}

const round = (n: number): number => Math.round(n * 10) / 10;

export function createStartupMetrics(clock: () => number = monotonicNow): StartupMetrics {
  // Process-relative marks survive retries; spans/counters and elapsedMs describe only the current attempt.
  const processOrigin = clock();
  let windowOrigin = processOrigin;
  let spans: Record<string, SpanStat> = {};
  let counters: Record<string, number> = {};
  const marks: Record<string, number> = {};

  const addSpan = (name: string, ms: number): void => {
    const stat = spans[name] ?? (spans[name] = { ms: 0, calls: 0, maxMs: 0 });
    stat.ms += ms;
    stat.calls += 1;
    if (ms > stat.maxMs) stat.maxMs = ms;
  };

  const metrics: StartupMetrics = {
    now: clock,
    mark(name) {
      if (!(name in marks)) marks[name] = clock() - processOrigin;
    },
    count(name, n = 1) {
      counters[name] = (counters[name] ?? 0) + n;
    },
    addSpan,
    async span(name, fn) {
      const start = clock();
      try {
        return await fn();
      } finally {
        addSpan(name, clock() - start);
      }
    },
    time(name, fn) {
      const start = clock();
      try {
        return fn();
      } finally {
        addSpan(name, clock() - start);
      }
    },
    snapshot() {
      const copy: Record<string, SpanStat> = {};
      for (const [k, v] of Object.entries(spans)) copy[k] = { ms: round(v.ms), calls: v.calls, maxMs: round(v.maxMs) };
      const markCopy: Record<string, number> = {};
      for (const [k, v] of Object.entries(marks)) markCopy[k] = round(v);
      return { elapsedMs: round(clock() - windowOrigin), spans: copy, counters: { ...counters }, marks: markCopy };
    },
    summary() {
      const s = metrics.snapshot();
      const spanPart = Object.entries(s.spans).map(([k, v]) => `${k}=${v.ms}ms${v.calls > 1 ? `/${v.calls}x(max ${v.maxMs})` : ""}`);
      const markPart = Object.entries(s.marks).map(([k, v]) => `@${k}=${v}ms`);
      const counterPart = Object.entries(s.counters).map(([k, v]) => `${k}=${v}`);
      return ["startup", `total=${s.elapsedMs}ms`, ...markPart, ...spanPart, ...counterPart].join(" ");
    },
    reset() {
      windowOrigin = clock();
      spans = {};
      counters = {};
      // Preserve process-relative app.jsStart/fonts.ready marks for retry diagnostics.
    }
  };
  return metrics;
}

const noop = (): void => undefined;

/** Metrics sink that records nothing; lets code accept optional metrics without null checks. */
export const NOOP_METRICS: StartupMetrics = {
  now: monotonicNow,
  mark: noop,
  count: noop,
  addSpan: noop,
  span: (_name, fn) => fn(),
  time: (_name, fn) => fn(),
  snapshot: () => ({ elapsedMs: 0, spans: {}, counters: {}, marks: {} }),
  summary: () => "startup (metrics disabled)",
  reset: noop
};

/** Process-wide metrics for the running app (fonts, provider mount, database startup). */
export const startupMetrics: StartupMetrics = createStartupMetrics();

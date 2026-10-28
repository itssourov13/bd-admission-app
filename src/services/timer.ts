/** Deadline-based timing. Wall-clock deadlines stay correct across backgrounding and re-renders. */
export type Clock = () => number;

export const systemClock: Clock = () => Date.now();

export function deadlineFrom(startMs: number, durationMs: number): number {
  return startMs + Math.max(0, Math.round(durationMs));
}

export function remainingMs(deadlineMs: number, nowMs: number): number {
  return Math.max(0, deadlineMs - nowMs);
}

export function isExpired(deadlineMs: number, nowMs: number): boolean {
  return nowMs >= deadlineMs;
}

/** Whole seconds to display, rounded up so "0" only shows once the deadline is reached. */
export function remainingSeconds(deadlineMs: number, nowMs: number): number {
  return Math.ceil(remainingMs(deadlineMs, nowMs) / 1000);
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export const FLASH_DEFAULT_SECONDS = 30;
export const FLASH_PRESETS = [15, 30, 45, 60] as const;
export const FLASH_MIN_SECONDS = 5;
export const FLASH_MAX_SECONDS = 600;

export function clampFlashSeconds(value: number): number {
  if (!Number.isFinite(value)) return FLASH_DEFAULT_SECONDS;
  return Math.min(FLASH_MAX_SECONDS, Math.max(FLASH_MIN_SECONDS, Math.round(value)));
}

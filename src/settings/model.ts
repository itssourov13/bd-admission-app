/** Pure settings model: defaults, validation and derived values. No React / native imports (unit-testable). */
export type ThemePreference = "system" | "light" | "dark";
export type MotionPreference = "system" | "reduced" | "full";
export type TextSize = "small" | "normal" | "large";

export interface AppSettings {
  theme: ThemePreference;
  motion: MotionPreference;
  haptics: boolean;
  questionTextSize: TextSize;
}

export const SETTINGS_STORAGE_KEY = "bd_admission_settings_v1";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  motion: "system",
  haptics: true,
  questionTextSize: "normal"
};

export const TEXT_SCALE: Record<TextSize, number> = { small: 0.9, normal: 1, large: 1.15 };

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

/** Tolerant parser: unknown/corrupt storage falls back per field to the defaults, never throws. */
export function parseSettings(raw: string | null | undefined): AppSettings {
  if (!raw) return DEFAULT_SETTINGS;
  let data: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return DEFAULT_SETTINGS;
    data = parsed as Record<string, unknown>;
  } catch {
    return DEFAULT_SETTINGS;
  }
  return {
    theme: oneOf(data.theme, ["system", "light", "dark"] as const, DEFAULT_SETTINGS.theme),
    motion: oneOf(data.motion, ["system", "reduced", "full"] as const, DEFAULT_SETTINGS.motion),
    haptics: typeof data.haptics === "boolean" ? data.haptics : DEFAULT_SETTINGS.haptics,
    questionTextSize: oneOf(data.questionTextSize, ["small", "normal", "large"] as const, DEFAULT_SETTINGS.questionTextSize)
  };
}

export const serializeSettings = (s: AppSettings): string => JSON.stringify(s);

/** The scheme actually rendered: an explicit preference wins; "system" follows the device (light when unknown). */
export function resolveScheme(preference: ThemePreference, system: "light" | "dark" | null | undefined): "light" | "dark" {
  if (preference === "light" || preference === "dark") return preference;
  return system === "dark" ? "dark" : "light";
}

/** Reduced motion applies when the person forces it, or when "system" and the OS asks for it. */
export function resolveReducedMotion(preference: MotionPreference, systemReduce: boolean): boolean {
  return preference === "reduced" ? true : preference === "full" ? false : systemReduce;
}

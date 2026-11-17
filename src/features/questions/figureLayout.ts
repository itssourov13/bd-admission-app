/** Fallback and limits for figure layout, so tall formulas and wide circuits both stay readable and never collapse. */
export const DEFAULT_FIGURE_ASPECT = 16 / 9;
export const MIN_FIGURE_ASPECT = 0.3;
export const MAX_FIGURE_ASPECT = 5;

/** width/height of an image, clamped; falls back to a safe default when the intrinsic size is unknown. */
export function figureAspectRatio(width?: number | null, height?: number | null): number {
  if (!width || !height || !(width > 0) || !(height > 0)) return DEFAULT_FIGURE_ASPECT;
  return Math.min(MAX_FIGURE_ASPECT, Math.max(MIN_FIGURE_ASPECT, width / height));
}

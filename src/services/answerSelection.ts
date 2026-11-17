/**
 * Question-type-aware answer selection shared by Flash, Standard Exam, Custom Practice, Browse and review.
 * Selections are always arrays of stable option keys, stored in the question's option order.
 */
export type SelectionMode = "single" | "multiple";

export function selectionModeOf(question: { type: "single_choice" | "multiple_choice" }): SelectionMode {
  return question.type === "multiple_choice" ? "multiple" : "single";
}

/** Applies one tap. Single choice replaces the selection; multiple choice toggles the key. Unknown keys are ignored. */
export function toggleSelection(mode: SelectionMode, current: readonly string[], key: string, optionKeys: readonly string[]): string[] {
  if (!optionKeys.includes(key)) return optionKeys.filter((k) => current.includes(k));
  if (mode === "single") return [key];
  const next = new Set(current);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return optionKeys.filter((k) => next.has(k));
}

/**
 * Validates a submission: every key must be an option of the question, without duplicates, and a single-choice
 * question takes exactly one key. Returns the keys in option order, or null when the submission is invalid.
 */
export function normalizeSubmission(mode: SelectionMode, keys: readonly string[], optionKeys: readonly string[]): string[] | null {
  if (keys.length === 0) return null;
  const unique = new Set(keys);
  if (unique.size !== keys.length) return null;
  if (![...unique].every((k) => optionKeys.includes(k))) return null;
  if (mode === "single" && unique.size !== 1) return null;
  return optionKeys.filter((k) => unique.has(k));
}

export interface SelectionReview {
  /** Correct keys the student selected. */
  matched: string[];
  /** Correct keys the student did not select. */
  missing: string[];
  /** Selected keys that are not correct. */
  extra: string[];
}

export function reviewSelection(correctKeys: readonly string[], selected: readonly string[], optionKeys: readonly string[]): SelectionReview {
  return {
    matched: optionKeys.filter((k) => correctKeys.includes(k) && selected.includes(k)),
    missing: optionKeys.filter((k) => correctKeys.includes(k) && !selected.includes(k)),
    extra: optionKeys.filter((k) => !correctKeys.includes(k) && selected.includes(k))
  };
}

export interface QuestionPackValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
export function validateQuestionPack(pack: unknown): QuestionPackValidation;

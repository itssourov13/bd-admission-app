export const ASSET_PREFIX: string;
export const ASSET_EXTENSIONS: string[];
export const MAX_ASSETS_PER_ITEM: number;
export function assetPathProblem(path: unknown): string | null;
export function validateAssetList(list: unknown, at: string): string[];
export interface QuestionAssetRef { kind: "question" | "option" | "explanation"; optionId?: string; path: string }
export function collectQuestionAssetRefs(question: unknown): QuestionAssetRef[];
export function validateQuestionAssets(question: unknown, label: string): string[];

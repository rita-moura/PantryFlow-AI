export interface NutritionEvaluationSnapshot {
  readonly calories: number;
  readonly protein: number;
  readonly carbs: number;
  readonly fat: number;
  readonly fiber: number;
}

export interface DeterministicEvaluationInput {
  readonly expectedNutrition: NutritionEvaluationSnapshot;
  readonly actualNutrition: NutritionEvaluationSnapshot;
  readonly inventoryQuantities: readonly number[];
  readonly expectedInventoryValid: boolean;
  readonly inventoryValid: boolean;
  readonly expectedMealValid: boolean;
  readonly mealValid: boolean;
  readonly tolerance?: number;
}

export interface DeterministicEvaluationResult {
  readonly passed: boolean;
  readonly nutrition: Readonly<Record<keyof NutritionEvaluationSnapshot, boolean>>;
  readonly inventory: { readonly passed: boolean; readonly nonNegative: boolean };
  readonly mealConstraints: { readonly passed: boolean };
}

const NUTRITION_FIELDS: readonly (keyof NutritionEvaluationSnapshot)[] = [
  'calories',
  'protein',
  'carbs',
  'fat',
  'fiber',
];

export function evaluateDeterministicCase(
  input: DeterministicEvaluationInput,
): DeterministicEvaluationResult {
  const tolerance = input.tolerance ?? 1e-6;
  if (!Number.isFinite(tolerance) || tolerance < 0)
    throw new Error('tolerance must be non-negative.');
  const nutrition = Object.fromEntries(
    NUTRITION_FIELDS.map((field) => [
      field,
      Math.abs(input.expectedNutrition[field] - input.actualNutrition[field]) <= tolerance,
    ]),
  ) as Readonly<Record<keyof NutritionEvaluationSnapshot, boolean>>;
  const nutritionPassed = Object.values(nutrition).every(Boolean);
  const nonNegative = input.inventoryQuantities.every(
    (quantity) => Number.isFinite(quantity) && quantity >= 0,
  );
  const inventory = {
    passed: nonNegative && input.inventoryValid === input.expectedInventoryValid,
    nonNegative,
  };
  const mealConstraints = { passed: input.mealValid === input.expectedMealValid };
  return {
    passed: nutritionPassed && inventory.passed && mealConstraints.passed,
    nutrition,
    inventory,
    mealConstraints,
  };
}

export interface RagEvaluationInput {
  readonly retrievedIds: readonly string[];
  readonly relevantIds: readonly string[];
  readonly k: number;
}

export interface RagEvaluationResult {
  readonly recallAtK: number;
  readonly precisionAtK: number;
  readonly mrr: number;
}

function validateK(k: number): void {
  if (!Number.isInteger(k) || k <= 0) throw new Error('k must be a positive integer.');
}

export function recallAtK(
  retrievedIds: readonly string[],
  relevantIds: readonly string[],
  k: number,
): number {
  validateK(k);
  if (relevantIds.length === 0) return 1;
  const relevant = new Set(relevantIds);
  return new Set(retrievedIds.slice(0, k).filter((id) => relevant.has(id))).size / relevant.size;
}

export function precisionAtK(
  retrievedIds: readonly string[],
  relevantIds: readonly string[],
  k: number,
): number {
  validateK(k);
  const topK = retrievedIds.slice(0, k);
  if (topK.length === 0) return 0;
  const relevant = new Set(relevantIds);
  return new Set(topK.filter((id) => relevant.has(id))).size / topK.length;
}

export function meanReciprocalRank(
  retrievedIds: readonly string[],
  relevantIds: readonly string[],
): number {
  const relevant = new Set(relevantIds);
  const rank = retrievedIds.findIndex((id) => relevant.has(id));
  return rank < 0 ? 0 : 1 / (rank + 1);
}

export function evaluateRagRetrieval(input: RagEvaluationInput): RagEvaluationResult {
  return {
    recallAtK: recallAtK(input.retrievedIds, input.relevantIds, input.k),
    precisionAtK: precisionAtK(input.retrievedIds, input.relevantIds, input.k),
    mrr: meanReciprocalRank(input.retrievedIds, input.relevantIds),
  };
}

export interface AiEvaluationInput {
  readonly relevance: number;
  readonly groundedness: number;
  readonly toolCorrectness: number;
  readonly instructionFollowing: number;
  readonly minimumScore?: number;
}

export interface AiEvaluationResult {
  readonly passed: boolean;
  readonly average: number;
  readonly scores: Readonly<Record<keyof Omit<AiEvaluationInput, 'minimumScore'>, number>>;
}

export function evaluateAiResponse(input: AiEvaluationInput): AiEvaluationResult {
  const scores = {
    relevance: input.relevance,
    groundedness: input.groundedness,
    toolCorrectness: input.toolCorrectness,
    instructionFollowing: input.instructionFollowing,
  };
  const values = Object.values(scores);
  if (values.some((score) => !Number.isFinite(score) || score < 0 || score > 1))
    throw new Error('AI evaluation scores must be between 0 and 1.');
  const average = values.reduce((sum, score) => sum + score, 0) / values.length;
  const minimumScore = input.minimumScore ?? 0.7;
  if (!Number.isFinite(minimumScore) || minimumScore < 0 || minimumScore > 1)
    throw new Error('minimumScore must be between 0 and 1.');
  return { passed: values.every((score) => score >= minimumScore), average, scores };
}

import {
  evaluateAiResponse,
  evaluateDeterministicCase,
  evaluateRagRetrieval,
  meanReciprocalRank,
  precisionAtK,
  recallAtK,
} from '../src/evaluation.js';

describe('evaluation metrics', () => {
  it('evaluates deterministic nutrition, inventory, and meal constraints', () => {
    const result = evaluateDeterministicCase({
      expectedNutrition: { calories: 2000, protein: 110, carbs: 240, fat: 65, fiber: 30 },
      actualNutrition: { calories: 2000.001, protein: 110, carbs: 240, fat: 65, fiber: 30 },
      inventoryQuantities: [1, 0],
      expectedInventoryValid: true,
      inventoryValid: true,
      expectedMealValid: true,
      mealValid: true,
      tolerance: 0.01,
    });
    expect(result.passed).toBe(true);
    expect(result.nutrition.calories).toBe(true);
  });

  it('calculates Recall@K, Precision@K and MRR', () => {
    expect(recallAtK(['a', 'b', 'c'], ['a', 'c'], 2)).toBe(0.5);
    expect(precisionAtK(['a', 'b', 'c'], ['a', 'c'], 2)).toBe(0.5);
    expect(meanReciprocalRank(['x', 'b', 'c'], ['b'])).toBe(0.5);
    expect(evaluateRagRetrieval({ retrievedIds: ['a', 'b'], relevantIds: ['b'], k: 2 })).toEqual({
      recallAtK: 1,
      precisionAtK: 0.5,
      mrr: 0.5,
    });
  });

  it('evaluates AI quality dimensions against a threshold', () => {
    expect(
      evaluateAiResponse({
        relevance: 0.9,
        groundedness: 0.8,
        toolCorrectness: 1,
        instructionFollowing: 0.75,
      }),
    ).toMatchObject({ passed: true });
    expect(
      evaluateAiResponse({
        relevance: 0.9,
        groundedness: 0.4,
        toolCorrectness: 1,
        instructionFollowing: 0.9,
      }).passed,
    ).toBe(false);
  });
});

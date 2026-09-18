import { GreenMetricsCollector, applyContextBudget, selectModel } from '../src/green.js';

describe('Green AI controls', () => {
  it('aggregates per-request resource measurements and cache hit rates', () => {
    const metrics = new GreenMetricsCollector();
    metrics.record({
      llmCalls: 1,
      tokens: 100,
      contextCharacters: 400,
      agentSteps: 2,
      embeddingCacheHit: true,
      nutritionApiCacheHit: false,
      latencyMs: 200,
    });
    metrics.record({
      llmCalls: 0,
      tokens: 0,
      contextCharacters: 200,
      agentSteps: 0,
      embeddingCacheHit: false,
      nutritionApiCacheHit: true,
      latencyMs: 100,
    });
    expect(metrics.summary()).toEqual({
      requests: 2,
      averageLlmCalls: 0.5,
      averageTokens: 50,
      averageContextCharacters: 300,
      averageAgentSteps: 1,
      embeddingCacheHitRate: 0.5,
      nutritionApiCacheHitRate: 0.5,
      averageLatencyMs: 150,
    });
  });

  it('routes deterministic requests without an LLM and applies context budgets', () => {
    expect(selectModel('CODE')).toBe('deterministic');
    expect(selectModel('RAG', { ragModel: 'small-model' })).toBe('small-model');
    expect(applyContextBudget('  abcdef  ', 4)).toEqual({
      content: 'abcd',
      truncated: true,
      characters: 4,
    });
  });

  it('rejects invalid resource measurements', () => {
    const metrics = new GreenMetricsCollector();
    expect(() =>
      metrics.record({
        llmCalls: -1,
        tokens: 0,
        contextCharacters: 0,
        agentSteps: 0,
        embeddingCacheHit: false,
        nutritionApiCacheHit: false,
        latencyMs: 0,
      }),
    ).toThrow('llmCalls');
  });
});

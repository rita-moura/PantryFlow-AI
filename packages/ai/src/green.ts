export interface GreenMeasurement {
  readonly llmCalls: number;
  readonly tokens: number;
  readonly contextCharacters: number;
  readonly agentSteps: number;
  readonly embeddingCacheHit: boolean;
  readonly nutritionApiCacheHit: boolean;
  readonly latencyMs: number;
}

export interface GreenMetricsSummary {
  readonly requests: number;
  readonly averageLlmCalls: number;
  readonly averageTokens: number;
  readonly averageContextCharacters: number;
  readonly averageAgentSteps: number;
  readonly embeddingCacheHitRate: number;
  readonly nutritionApiCacheHitRate: number;
  readonly averageLatencyMs: number;
}

function nonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be non-negative.`);
}

export class GreenMetricsCollector {
  private readonly measurements: GreenMeasurement[] = [];

  record(measurement: GreenMeasurement): void {
    nonNegative(measurement.llmCalls, 'llmCalls');
    nonNegative(measurement.tokens, 'tokens');
    nonNegative(measurement.contextCharacters, 'contextCharacters');
    nonNegative(measurement.agentSteps, 'agentSteps');
    nonNegative(measurement.latencyMs, 'latencyMs');
    this.measurements.push({ ...measurement });
  }

  summary(): GreenMetricsSummary {
    const requests = this.measurements.length;
    if (requests === 0)
      return {
        requests: 0,
        averageLlmCalls: 0,
        averageTokens: 0,
        averageContextCharacters: 0,
        averageAgentSteps: 0,
        embeddingCacheHitRate: 0,
        nutritionApiCacheHitRate: 0,
        averageLatencyMs: 0,
      };
    const total = (selector: (measurement: GreenMeasurement) => number): number =>
      this.measurements.reduce((sum, measurement) => sum + selector(measurement), 0);
    return {
      requests,
      averageLlmCalls: total(({ llmCalls }) => llmCalls) / requests,
      averageTokens: total(({ tokens }) => tokens) / requests,
      averageContextCharacters: total(({ contextCharacters }) => contextCharacters) / requests,
      averageAgentSteps: total(({ agentSteps }) => agentSteps) / requests,
      embeddingCacheHitRate: total(({ embeddingCacheHit }) => Number(embeddingCacheHit)) / requests,
      nutritionApiCacheHitRate:
        total(({ nutritionApiCacheHit }) => Number(nutritionApiCacheHit)) / requests,
      averageLatencyMs: total(({ latencyMs }) => latencyMs) / requests,
    };
  }
}

export type GreenRoute = 'CODE' | 'RAG' | 'AGENT';

export interface ModelRoutingOptions {
  readonly ragModel?: string;
  readonly agentModel?: string;
}

export function selectModel(route: GreenRoute, options: ModelRoutingOptions = {}): string {
  if (route === 'CODE') return 'deterministic';
  if (route === 'RAG') return options.ragModel ?? 'gemini-2.5-flash';
  return options.agentModel ?? 'gemini-2.5-flash';
}

export interface ContextBudgetResult {
  readonly content: string;
  readonly truncated: boolean;
  readonly characters: number;
}

export function applyContextBudget(content: string, maxCharacters: number): ContextBudgetResult {
  if (!Number.isInteger(maxCharacters) || maxCharacters <= 0)
    throw new Error('maxCharacters must be a positive integer.');
  const normalized = content.trim();
  const bounded = normalized.slice(0, maxCharacters);
  return {
    content: bounded,
    truncated: bounded.length < normalized.length,
    characters: bounded.length,
  };
}

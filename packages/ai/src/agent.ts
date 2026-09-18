import type {
  DailyProgressToolInput,
  ToolContext,
  ToolInputMap,
  ToolRegistry,
  ToolResultMap,
} from './tools.js';
import { newTraceId, recordTrace, type TraceSink } from './observability.js';

export interface MealPlanningAgentConfig {
  readonly maxSteps?: number;
  readonly maxToolCalls?: number;
  readonly maxRetries?: number;
  readonly timeoutMs?: number;
  readonly tokenBudget?: number;
}

export interface MealPlanningRequest {
  readonly userId: string;
  readonly goal: string;
  readonly planId: string;
  readonly date?: DailyProgressToolInput['date'];
}

export interface MealPlanProposal {
  readonly planId: string;
  readonly changes: readonly Record<string, unknown>[];
  readonly mealIds?: readonly string[];
}

export interface MealPlanningObservations {
  readonly goals: ToolResultMap['getNutritionGoals'];
  readonly progress: ToolResultMap['getDailyNutritionProgress'];
  readonly pantry: ToolResultMap['getPantryItems'];
  readonly expiring: ToolResultMap['getExpiringItems'];
  readonly recipes: ToolResultMap['searchRecipes'];
  readonly mealNutrition: readonly ToolResultMap['calculateMealNutrition'][];
}

export interface MealPlanningAgentResult {
  readonly status: 'completed' | 'rejected';
  readonly proposal: MealPlanProposal;
  readonly observations: MealPlanningObservations;
  readonly validation: ToolResultMap['validateMealPlan'];
  readonly shoppingList?: ToolResultMap['generateShoppingList'];
  readonly steps: number;
  readonly toolCalls: number;
  readonly retries: number;
  readonly estimatedTokens: number;
}

export interface MealPlanningAgentDependencies {
  readonly tools: ToolRegistry;
  readonly composePlan: (
    request: MealPlanningRequest,
    observations: Omit<MealPlanningObservations, 'mealNutrition'>,
  ) => Promise<MealPlanProposal>;
  readonly config?: MealPlanningAgentConfig;
  readonly traceSink?: TraceSink;
}

const DEFAULTS: Required<MealPlanningAgentConfig> = {
  maxSteps: 6,
  maxToolCalls: 10,
  maxRetries: 2,
  timeoutMs: 10_000,
  tokenBudget: 8_000,
};

function positiveInteger(value: number, name: string): number {
  if (!Number.isInteger(value) || value <= 0)
    throw new Error(`${name} must be a positive integer.`);
  return value;
}

function mergeConfig(
  config: MealPlanningAgentConfig | undefined,
): Required<MealPlanningAgentConfig> {
  const merged = { ...DEFAULTS, ...config };
  positiveInteger(merged.maxSteps, 'maxSteps');
  positiveInteger(merged.maxToolCalls, 'maxToolCalls');
  if (!Number.isInteger(merged.maxRetries) || merged.maxRetries < 0)
    throw new Error('maxRetries must be a non-negative integer.');
  positiveInteger(merged.timeoutMs, 'timeoutMs');
  positiveInteger(merged.tokenBudget, 'tokenBudget');
  return merged;
}

function estimateTokens(value: unknown): number {
  return Math.ceil(JSON.stringify(value).length / 4);
}

export class MealPlanningAgent {
  private readonly config: Required<MealPlanningAgentConfig>;

  constructor(private readonly dependencies: MealPlanningAgentDependencies) {
    this.config = mergeConfig(dependencies.config);
  }

  async run(request: MealPlanningRequest): Promise<MealPlanningAgentResult> {
    if (!request.userId.trim()) throw new Error('Authenticated user context is required.');
    if (!request.goal.trim()) throw new Error('goal is required.');
    if (!request.planId.trim()) throw new Error('planId is required.');

    const startedAt = Date.now();
    const traceId = newTraceId();
    let steps = 0;
    let toolCalls = 0;
    let retries = 0;
    let estimatedTokens = estimateTokens(request);
    const context: ToolContext = { userId: request.userId };
    await recordTrace(this.dependencies.traceSink, {
      traceId,
      type: 'request',
      timestamp: new Date().toISOString(),
      success: true,
      metadata: { goalLength: request.goal.length },
    });
    const step = (): void => {
      steps += 1;
      if (steps > this.config.maxSteps) throw new Error('Agent step limit exceeded.');
      void recordTrace(this.dependencies.traceSink, {
        traceId,
        type: 'agent_step',
        timestamp: new Date().toISOString(),
        agentStep: steps,
        success: true,
        metadata: { maxSteps: this.config.maxSteps },
      });
    };
    const call = async <K extends keyof ToolInputMap>(
      name: K,
      input: ToolInputMap[K],
    ): Promise<ToolResultMap[K]> => {
      if (Date.now() - startedAt >= this.config.timeoutMs)
        throw new Error('Agent timeout exceeded.');
      if (toolCalls >= this.config.maxToolCalls) throw new Error('Agent tool-call limit exceeded.');
      const tool = this.dependencies.tools.get(name);
      if (!tool) throw new Error(`Tool ${name} is not registered.`);
      let lastError: unknown;
      for (let attempt = 0; attempt <= this.config.maxRetries; attempt += 1) {
        toolCalls += 1;
        try {
          const remaining = this.config.timeoutMs - (Date.now() - startedAt);
          if (remaining <= 0) throw new Error('Agent timeout exceeded.');
          const result = await Promise.race([
            tool.execute(input, context),
            new Promise<never>((_, reject) => {
              const timer = setTimeout(
                () => reject(new Error('Agent tool timeout exceeded.')),
                remaining,
              );
              timer.unref?.();
            }),
          ]);
          estimatedTokens += estimateTokens(result);
          if (estimatedTokens > this.config.tokenBudget)
            throw new Error('Agent token budget exceeded.');
          await recordTrace(this.dependencies.traceSink, {
            traceId,
            type: 'tool_call',
            timestamp: new Date().toISOString(),
            toolName: name,
            agentStep: steps,
            success: true,
            metadata: { attempt, toolCalls },
          });
          return result as ToolResultMap[K];
        } catch (error) {
          lastError = error;
          if (attempt < this.config.maxRetries) retries += 1;
        }
      }
      throw lastError instanceof Error ? lastError : new Error('Agent tool call failed.');
    };

    step();
    const goals = await call('getNutritionGoals', {});
    const progress = await call('getDailyNutritionProgress', { date: request.date });
    step();
    const pantry = await call('getPantryItems', { includeExpired: false });
    const expiring = await call('getExpiringItems', { withinDays: 3 });
    step();
    const recipes = await call('searchRecipes', { query: request.goal, limit: 5 });
    const baseObservations = { goals, progress, pantry, expiring, recipes };
    const proposal = await this.dependencies.composePlan(request, baseObservations);
    if (proposal.planId !== request.planId)
      throw new Error('Agent proposal planId does not match request.');
    step();
    const mealIds = proposal.mealIds ?? [];
    const mealNutrition: ToolResultMap['calculateMealNutrition'][] = [];
    for (const mealId of mealIds) {
      mealNutrition.push(await call('calculateMealNutrition', { mealId }));
    }
    step();
    const validation = await call('validateMealPlan', { planId: proposal.planId });
    const observations = { ...baseObservations, mealNutrition };
    await recordTrace(this.dependencies.traceSink, {
      traceId,
      type: 'validation',
      timestamp: new Date().toISOString(),
      agentStep: steps,
      success: validation.valid,
      metadata: { valid: validation.valid },
    });
    if (!validation.valid) {
      await recordTrace(this.dependencies.traceSink, {
        traceId,
        type: 'response',
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
        success: false,
        metadata: { status: 'rejected', toolCalls, retries },
      });
      return {
        status: 'rejected',
        proposal,
        observations,
        validation,
        steps,
        toolCalls,
        retries,
        estimatedTokens,
      };
    }
    step();
    await call('updateMealPlan', { planId: proposal.planId, changes: proposal.changes });
    const shoppingList = await call('generateShoppingList', { planId: proposal.planId });
    await recordTrace(this.dependencies.traceSink, {
      traceId,
      type: 'response',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      success: true,
      metadata: { status: 'completed', toolCalls, retries },
    });
    return {
      status: 'completed',
      proposal,
      observations,
      validation,
      shoppingList,
      steps,
      toolCalls,
      retries,
      estimatedTokens,
    };
  }
}

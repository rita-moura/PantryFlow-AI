import type { RagPipeline } from './rag.js';

export type AssistantRoute = 'CODE' | 'RAG' | 'AGENT';

export interface AssistantDecision {
  readonly route: AssistantRoute;
  readonly reason: string;
}

export interface AssistantHandlers {
  readonly code: (question: string) => Promise<string>;
  readonly rag: (question: string) => Promise<string>;
  readonly agent: (question: string) => Promise<string>;
}

export interface AssistantResponse {
  readonly route: AssistantRoute;
  readonly answer: string;
}

export function routeAssistantRequest(question: string): AssistantDecision {
  const normalized = question.trim().toLowerCase();
  if (!normalized) throw new Error('Assistant request cannot be empty.');
  if (/(reorgan|replan|replanej|restante do dia|entire day|todo meu dia)/u.test(normalized)) {
    return {
      route: 'AGENT',
      reason: 'The request changes or coordinates multiple future actions.',
    };
  }
  if (
    /(quanto|quantas|calor|prote[ií]na|protein|fibra|fiber|carboidrato|carb|gordura|fat|meta|goal|falta|left)/u.test(
      normalized,
    )
  ) {
    return {
      route: 'CODE',
      reason: 'The request is answered by deterministic nutrition calculations.',
    };
  }
  return {
    route: 'RAG',
    reason: 'The request needs grounded retrieval from recipe or knowledge content.',
  };
}

export class AssistantService {
  constructor(private readonly handlers: AssistantHandlers) {}

  async answer(question: string): Promise<AssistantResponse> {
    const decision = routeAssistantRequest(question);
    const answer =
      await this.handlers[decision.route.toLowerCase() as keyof AssistantHandlers](question);
    return { route: decision.route, answer };
  }
}

export function createAssistantHandlers(
  rag: RagPipeline,
  code: AssistantHandlers['code'],
  agent: AssistantHandlers['agent'],
): AssistantHandlers {
  return {
    code,
    agent,
    rag: async (question) => (await rag.answer(question)).answer,
  };
}

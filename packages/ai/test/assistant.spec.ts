import { AssistantService, routeAssistantRequest } from '../src/assistant.js';

describe('assistant request router', () => {
  it('routes deterministic nutrition questions to CODE', () => {
    expect(routeAssistantRequest('Quanto de proteína falta hoje?').route).toBe('CODE');
  });

  it('routes grounded knowledge questions to RAG', () => {
    expect(routeAssistantRequest('Quero algo doce e proteico.').route).toBe('RAG');
  });

  it('routes multi-step replanning to AGENT', () => {
    expect(routeAssistantRequest('Reorganize todo meu restante do dia.').route).toBe('AGENT');
  });

  it('invokes only the selected handler', async () => {
    const handlers = {
      code: jest.fn().mockResolvedValue('calculated'),
      rag: jest.fn().mockResolvedValue('retrieved'),
      agent: jest.fn().mockResolvedValue('planned'),
    };
    const service = new AssistantService(handlers);
    await expect(service.answer('How much protein is left?')).resolves.toEqual({
      route: 'CODE',
      answer: 'calculated',
    });
    expect(handlers.code).toHaveBeenCalledTimes(1);
    expect(handlers.rag).not.toHaveBeenCalled();
    expect(handlers.agent).not.toHaveBeenCalled();
  });
});

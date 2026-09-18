import { RagPipeline, buildRagContext, normalizeRagQuery } from '../src/rag.js';
import type { RagDocument, RagSearchStore } from '../src/rag.js';

const docs: RagDocument[] = [
  { id: 'r1', source: 'recipe', content: 'High protein oats with yogurt.' },
  { id: 'r2', source: 'recipe', content: 'Roasted vegetables with rice.' },
];

describe('RAG pipeline', () => {
  it('normalizes queries and combines vector and keyword evidence', async () => {
    const store: RagSearchStore = {
      vectorSearch: jest
        .fn()
        .mockResolvedValue([{ document: docs[0], score: 0.8, matchedBy: 'VECTOR' }]),
      keywordSearch: jest
        .fn()
        .mockResolvedValue([{ document: docs[0], score: 1, matchedBy: 'KEYWORD' }]),
    };
    const provider = { model: 'test', embed: jest.fn().mockResolvedValue([1, 2]) };
    const pipeline = new RagPipeline(provider, store, {
      generate: jest.fn().mockResolvedValue('Use oats.'),
    });
    const result = await pipeline.answer('  Protein   OATS ', { topK: 3 });
    expect(normalizeRagQuery('  Protein   OATS ')).toBe('protein oats');
    expect(result.sources[0]?.matchedBy).toBe('HYBRID');
    expect(result.context).toContain('recipe/r1');
  });

  it('enforces a context budget and does not send the whole corpus', () => {
    expect(
      buildRagContext(
        docs.map((document) => ({ document, score: 1, matchedBy: 'KEYWORD' })),
        100,
      ),
    ).toContain('[1]');
    expect(
      buildRagContext(
        docs.map((document) => ({ document, score: 1, matchedBy: 'KEYWORD' })),
        100,
      ).length,
    ).toBeLessThanOrEqual(100);
  });
});

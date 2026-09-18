import {
  EmbeddingCache,
  embedWithCache,
  GeminiEmbeddingProvider,
  hashEmbeddingContent,
} from '../src/index.js';
import { EMBEDDING_DIMENSIONS } from '../src/embeddings.js';

const vector = (): number[] =>
  Array.from({ length: EMBEDDING_DIMENSIONS }, (_, index) => index / 1000);

describe('embedding pipeline', () => {
  it('normalizes, hashes, and caches by content and model', async () => {
    const provider = { model: 'test-model', embed: jest.fn().mockResolvedValue(vector()) };
    const cache = new EmbeddingCache();
    const first = await embedWithCache('  recipe   text ', provider, cache);
    const second = await embedWithCache('recipe text', provider, cache);
    expect(first.cacheHit).toBe(false);
    expect(second.cacheHit).toBe(true);
    expect(provider.embed).toHaveBeenCalledTimes(1);
    expect(first.contentHash).toBe(hashEmbeddingContent('recipe text'));
  });

  it('calls Gemini with a bounded 768-dimensional request', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ embedding: { values: vector() } }),
    });
    const provider = new GeminiEmbeddingProvider('secret', 'gemini-embedding-001', fetcher);
    await expect(provider.embed('recipe')).resolves.toHaveLength(768);
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining('embedContent'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

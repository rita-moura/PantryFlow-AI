import { createHash } from 'node:crypto';
import { newTraceId, recordTrace, type TraceSink } from './observability.js';

export const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';
export const EMBEDDING_DIMENSIONS = 768;

export interface EmbeddingProvider {
  readonly model: string;
  embed(content: string): Promise<readonly number[]>;
}

export interface CachedEmbedding {
  readonly contentHash: string;
  readonly model: string;
  readonly vector: readonly number[];
  readonly cacheHit: boolean;
}

export function normalizeEmbeddingContent(content: string): string {
  return content.trim().replace(/\s+/g, ' ');
}

export function hashEmbeddingContent(content: string): string {
  return createHash('sha256').update(normalizeEmbeddingContent(content)).digest('hex');
}

function assertVector(vector: readonly number[]): void {
  if (vector.length !== EMBEDDING_DIMENSIONS || vector.some((value) => !Number.isFinite(value))) {
    throw new Error(`Embedding provider must return ${EMBEDDING_DIMENSIONS} finite dimensions.`);
  }
}

export class EmbeddingCache {
  private readonly values = new Map<string, readonly number[]>();

  get(contentHash: string, model: string): readonly number[] | undefined {
    return this.values.get(`${model}:${contentHash}`);
  }

  set(contentHash: string, model: string, vector: readonly number[]): void {
    assertVector(vector);
    this.values.set(`${model}:${contentHash}`, [...vector]);
  }
}

export async function embedWithCache(
  content: string,
  provider: EmbeddingProvider,
  cache: EmbeddingCache,
  traceSink?: TraceSink,
): Promise<CachedEmbedding> {
  const normalized = normalizeEmbeddingContent(content);
  if (!normalized) throw new Error('Embedding content cannot be empty.');
  const contentHash = hashEmbeddingContent(normalized);
  const cached = cache.get(contentHash, provider.model);
  if (cached) {
    await recordTrace(traceSink, {
      traceId: newTraceId(),
      type: 'embedding',
      timestamp: new Date().toISOString(),
      model: provider.model,
      success: true,
      metadata: { cacheHit: true, dimensions: cached.length },
    });
    return { contentHash, model: provider.model, vector: cached, cacheHit: true };
  }
  const vector = await provider.embed(normalized);
  assertVector(vector);
  cache.set(contentHash, provider.model, vector);
  await recordTrace(traceSink, {
    traceId: newTraceId(),
    type: 'embedding',
    timestamp: new Date().toISOString(),
    model: provider.model,
    success: true,
    metadata: { cacheHit: false, dimensions: vector.length },
  });
  return { contentHash, model: provider.model, vector, cacheHit: false };
}

interface GeminiResponse {
  readonly embedding?: { readonly values?: readonly number[] };
}
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly model: string;
  constructor(
    private readonly apiKey = process.env.GEMINI_API_KEY,
    model = DEFAULT_EMBEDDING_MODEL,
    private readonly fetcher: FetchLike = fetch,
  ) {
    this.model = model;
  }

  async embed(content: string): Promise<readonly number[]> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY is required for embeddings.');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await this.fetcher(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: content }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    });
    if (!response.ok) throw new Error(`Gemini embedding request failed with ${response.status}.`);
    const body = (await response.json()) as GeminiResponse;
    if (!body.embedding?.values) throw new Error('Gemini response did not include an embedding.');
    return body.embedding.values;
  }
}

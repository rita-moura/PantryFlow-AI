import type { EmbeddingProvider } from './embeddings.js';

export interface RagDocument {
  readonly id: string;
  readonly source: string;
  readonly content: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface RagSearchFilters {
  readonly source?: string;
  readonly keyword?: string;
}

export interface RetrievedDocument {
  readonly document: RagDocument;
  readonly score: number;
  readonly matchedBy: 'VECTOR' | 'KEYWORD' | 'HYBRID';
}

export interface RagSearchStore {
  vectorSearch(
    vector: readonly number[],
    limit: number,
    filters?: RagSearchFilters,
  ): Promise<readonly RetrievedDocument[]>;
  keywordSearch(
    query: string,
    limit: number,
    filters?: RagSearchFilters,
  ): Promise<readonly RetrievedDocument[]>;
}

export interface GroundedAnswerProvider {
  generate(question: string, context: string): Promise<string>;
}

export interface RagAnswer {
  readonly answer: string;
  readonly sources: readonly RetrievedDocument[];
  readonly context: string;
}

export function normalizeRagQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function buildRagContext(
  documents: readonly RetrievedDocument[],
  maxCharacters = 6_000,
): string {
  if (!Number.isInteger(maxCharacters) || maxCharacters < 100)
    throw new Error('Context budget must be at least 100 characters.');
  let context = '';
  for (const [index, result] of documents.entries()) {
    const block = `[${index + 1}] ${result.document.source}/${result.document.id}\n${result.document.content}\n\n`;
    if (context.length + block.length > maxCharacters) break;
    context += block;
  }
  return context.trim();
}

function mergeResults(
  vectorResults: readonly RetrievedDocument[],
  keywordResults: readonly RetrievedDocument[],
  limit: number,
): readonly RetrievedDocument[] {
  const merged = new Map<string, RetrievedDocument>();
  for (const result of vectorResults) merged.set(result.document.id, result);
  for (const result of keywordResults) {
    const current = merged.get(result.document.id);
    if (!current) merged.set(result.document.id, result);
    else
      merged.set(result.document.id, {
        ...current,
        score: current.score + result.score,
        matchedBy: 'HYBRID',
      });
  }
  return [...merged.values()]
    .sort(
      (left, right) =>
        right.score - left.score || left.document.id.localeCompare(right.document.id),
    )
    .slice(0, limit);
}

export class RagPipeline {
  constructor(
    private readonly embedder: EmbeddingProvider,
    private readonly store: RagSearchStore,
    private readonly answerProvider: GroundedAnswerProvider,
  ) {}

  async answer(
    question: string,
    options: {
      readonly topK?: number;
      readonly contextBudget?: number;
      readonly filters?: RagSearchFilters;
    } = {},
  ): Promise<RagAnswer> {
    const query = normalizeRagQuery(question);
    if (!query) throw new Error('Question cannot be empty.');
    const topK = Math.min(Math.max(options.topK ?? 5, 1), 20);
    const vector = await this.embedder.embed(query);
    const [vectorResults, keywordResults] = await Promise.all([
      this.store.vectorSearch(vector, topK, options.filters),
      this.store.keywordSearch(query, topK, options.filters),
    ]);
    const sources = mergeResults(vectorResults, keywordResults, topK);
    const context = buildRagContext(sources, options.contextBudget ?? 6_000);
    const answer = await this.answerProvider.generate(query, context);
    return { answer, sources, context };
  }
}

interface GeminiGenerationResponse {
  readonly candidates?: readonly {
    readonly content?: { readonly parts?: readonly { readonly text?: string }[] };
  }[];
}
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class GeminiGroundedAnswerProvider implements GroundedAnswerProvider {
  constructor(
    private readonly apiKey = process.env.GEMINI_API_KEY,
    private readonly model = 'gemini-2.5-flash',
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async generate(question: string, context: string): Promise<string> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY is required for grounded answers.');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await this.fetcher(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Answer only from the supplied context. If it is insufficient, say so.\n\nContext:\n${context}\n\nQuestion: ${question}`,
              },
            ],
          },
        ],
      }),
    });
    if (!response.ok) throw new Error(`Gemini generation request failed with ${response.status}.`);
    const body = (await response.json()) as GeminiGenerationResponse;
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('Gemini response did not include grounded text.');
    return text;
  }
}

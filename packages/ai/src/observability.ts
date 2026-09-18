import { randomUUID } from 'node:crypto';

export type TraceEventType =
  | 'request'
  | 'routing'
  | 'retrieval'
  | 'embedding'
  | 'vector_search'
  | 'llm_generation'
  | 'agent_step'
  | 'tool_call'
  | 'validation'
  | 'response';

export interface TraceEvent {
  readonly traceId: string;
  readonly type: TraceEventType;
  readonly timestamp: string;
  readonly latencyMs?: number;
  readonly model?: string;
  readonly tokens?: number;
  readonly toolName?: string;
  readonly agentStep?: number;
  readonly retrievedItems?: number;
  readonly success: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface TraceSink {
  record(event: TraceEvent): void | Promise<void>;
}

const SENSITIVE_KEY = /(secret|token|authorization|password|api[-_]?key|cookie|credential)/iu;

export function sanitizeTraceMetadata(
  metadata: Readonly<Record<string, unknown>> | undefined,
): Readonly<Record<string, unknown>> | undefined {
  if (!metadata) return undefined;
  const sanitize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sanitize);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        SENSITIVE_KEY.test(key) ? '[REDACTED]' : sanitize(nested),
      ]),
    );
  };
  return sanitize(metadata) as Readonly<Record<string, unknown>>;
}

export async function recordTrace(sink: TraceSink | undefined, event: TraceEvent): Promise<void> {
  if (!sink) return;
  try {
    await sink.record({ ...event, metadata: sanitizeTraceMetadata(event.metadata) });
  } catch {
    // Observability must never change product behavior when the exporter is unavailable.
  }
}

export function newTraceId(): string {
  return randomUUID();
}

export class InMemoryTraceSink implements TraceSink {
  readonly events: TraceEvent[] = [];

  record(event: TraceEvent): void {
    this.events.push({ ...event, metadata: sanitizeTraceMetadata(event.metadata) });
  }
}

interface LangfuseBatchEvent {
  readonly id: string;
  readonly type: 'trace-create' | 'span-create';
  readonly timestamp: string;
  readonly body: Readonly<Record<string, unknown>>;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface LangfuseTraceSinkOptions {
  readonly baseUrl?: string;
  readonly publicKey?: string;
  readonly secretKey?: string;
  readonly fetcher?: FetchLike;
  readonly onError?: (error: unknown) => void;
}

export class LangfuseTraceSink implements TraceSink {
  private readonly baseUrl: string;
  private readonly publicKey?: string;
  private readonly secretKey?: string;
  private readonly fetcher: FetchLike;
  private readonly onError?: (error: unknown) => void;

  constructor(options: LangfuseTraceSinkOptions = {}) {
    this.baseUrl = (
      options.baseUrl ??
      process.env.LANGFUSE_BASE_URL ??
      'https://cloud.langfuse.com'
    ).replace(/\/$/u, '');
    this.publicKey = options.publicKey ?? process.env.LANGFUSE_PUBLIC_KEY;
    this.secretKey = options.secretKey ?? process.env.LANGFUSE_SECRET_KEY;
    this.fetcher = options.fetcher ?? fetch;
    this.onError = options.onError;
  }

  async record(event: TraceEvent): Promise<void> {
    if (!this.publicKey || !this.secretKey) return;
    const safeEvent = { ...event, metadata: sanitizeTraceMetadata(event.metadata) };
    const body: LangfuseBatchEvent = {
      id: randomUUID(),
      type: event.type === 'request' ? 'trace-create' : 'span-create',
      timestamp: event.timestamp,
      body: {
        id: event.traceId,
        name: `pantryflow.${event.type}`,
        ...safeEvent,
      },
    };
    try {
      const response = await this.fetcher(`${this.baseUrl}/api/public/ingestion`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Basic ${Buffer.from(`${this.publicKey}:${this.secretKey}`).toString('base64')}`,
        },
        body: JSON.stringify({ batch: [body] }),
      });
      if (!response.ok) throw new Error(`Langfuse ingestion failed with ${response.status}.`);
    } catch (error) {
      this.onError?.(error);
      throw error;
    }
  }
}

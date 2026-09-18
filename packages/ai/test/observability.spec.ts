import {
  InMemoryTraceSink,
  LangfuseTraceSink,
  recordTrace,
  sanitizeTraceMetadata,
} from '../src/observability.js';

describe('AI observability', () => {
  it('redacts secrets recursively before recording metadata', () => {
    expect(
      sanitizeTraceMetadata({
        model: 'test',
        apiKey: 'hidden',
        nested: { authorization: 'bearer hidden', count: 2 },
      }),
    ).toEqual({
      model: 'test',
      apiKey: '[REDACTED]',
      nested: { authorization: '[REDACTED]', count: 2 },
    });
  });

  it('does not fail the request when an exporter is unavailable', async () => {
    const sink = { record: jest.fn().mockRejectedValue(new Error('offline')) };
    await expect(
      recordTrace(sink, {
        traceId: 'trace-1',
        type: 'response',
        timestamp: new Date().toISOString(),
        success: true,
      }),
    ).resolves.toBeUndefined();
  });

  it('sends a sanitized event to Langfuse without putting secrets in the body', async () => {
    const fetcher = jest.fn().mockResolvedValue(new Response('', { status: 202 }));
    const sink = new LangfuseTraceSink({
      baseUrl: 'https://langfuse.test/',
      publicKey: 'public',
      secretKey: 'private',
      fetcher,
    });
    await sink.record({
      traceId: 'trace-1',
      type: 'request',
      timestamp: new Date().toISOString(),
      success: true,
      metadata: { accessToken: 'must-not-be-sent' },
    });

    expect(fetcher).toHaveBeenCalledWith(
      'https://langfuse.test/api/public/ingestion',
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: expect.stringContaining('Basic ') }),
        body: expect.not.stringContaining('must-not-be-sent'),
      }),
    );
  });

  it('keeps an in-memory sink useful for tests', () => {
    const sink = new InMemoryTraceSink();
    sink.record({
      traceId: 'trace-1',
      type: 'routing',
      timestamp: new Date().toISOString(),
      success: true,
      metadata: { token: 'hidden' },
    });
    expect(sink.events[0]?.metadata).toEqual({ token: '[REDACTED]' });
  });
});

# Langfuse observability

Phase 15 adds a provider-neutral `TraceSink` and a `LangfuseTraceSink` to the AI package. The
assistant, RAG pipeline, embedding cache, and meal-planning agent emit events for requests,
routing, embeddings, retrieval, vector search, generation, agent steps, tool calls, validation,
and responses.

Events contain operational measurements such as latency, model, token estimates, tool names,
retrieved item counts, success state, and safe metadata. Metadata is recursively sanitized by key;
values under names such as `token`, `authorization`, `password`, `apiKey`, and `secret` are replaced
with `[REDACTED]`. Authentication credentials are used only in the HTTP Authorization header and
are never included in the event body. Export failures are swallowed so observability cannot break a
product request.

Configure the exporter with `LANGFUSE_BASE_URL`, `LANGFUSE_PUBLIC_KEY`, and
`LANGFUSE_SECRET_KEY`. Without both keys, the sink remains disabled. `InMemoryTraceSink` is
available for tests and local verification.

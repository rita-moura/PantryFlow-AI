# Retrieval Augmented Generation

Phase 11 adds the RAG orchestration foundation. Queries are normalized, embedded, and sent to a
retrieval store through both vector and keyword paths. Results are merged by document ID, filtered by
optional structured source filters, ranked deterministically, and capped by a context character budget.

The answer provider receives only the selected context and an instruction to remain grounded in it. The
Gemini adapter refuses empty responses and keeps the API key server-side. The pipeline never sends the
whole corpus to the model.

Database-backed pgvector search is supplied through the `RagSearchStore` interface in the next service
integration; this package keeps retrieval and generation independently testable.

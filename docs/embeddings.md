# Embeddings

Phase 10 adds the embedding foundation without starting RAG. Content is normalized before hashing,
and the SHA-256 hash plus model identifies a cache entry. Cache hits skip Gemini calls entirely.

`GeminiEmbeddingProvider` calls Gemini's `embedContent` endpoint with `outputDimensionality: 768`
and validates that every returned value is finite. API keys remain server-side through
`GEMINI_API_KEY`; the browser never receives provider credentials.

Recipes already reserve `vector(768)` storage. This phase adds the `knowledge_chunks` table with the
same vector dimension, content hash uniqueness, source metadata, and embedding model. Vector search,
RAG retrieval, and assistant behavior begin in later phases.

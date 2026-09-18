# AI Evaluation

Phase 16 separates evaluation into deterministic, retrieval, and AI quality suites. Versioned
datasets live under `evaluation/datasets/v1/` and are deliberately independent from production
requests.

Deterministic evaluation checks nutrition fields (calories, protein, carbohydrates, fat, and
fiber), non-negative inventory, and meal-plan constraints. RAG evaluation reports Recall@K,
Precision@K, and Mean Reciprocal Rank from retrieved and relevant IDs. AI evaluation reports
relevance, groundedness, tool correctness, and instruction following against a configurable score
threshold.

The metrics are pure TypeScript functions, so they are reproducible in CI and can later consume
exported Langfuse datasets without coupling evaluation to a model provider. The current datasets
are small versioned fixtures; expanding them and adding production runs is the next evaluation
iteration.

# Green AI / Green Code

Phase 17 adds measurable resource controls instead of making unverified cost or energy claims.
`GreenMetricsCollector` records LLM calls per request, estimated tokens, context characters, agent
steps, embedding cache hits, nutrition API cache hits, and response latency. Its summary exposes
averages and cache hit rates for dashboards or Langfuse exports.

The AI package also provides deterministic model routing (`CODE` returns `deterministic`), context
budget truncation, and the existing agent limits for steps, tool calls, retries, timeout, and token
budget. Embedding and external nutrition caching remain observable through their cache-hit fields.

The measurements in this repository are instrumentation primitives. No reduction in cost, energy,
or emissions is claimed until production measurements are collected and compared.

# AI Assistant

Phase 12 adds the request router that decides whether a request belongs to deterministic code, grounded
RAG, or a bounded agent workflow. Nutrition and progress questions route to `CODE`, knowledge and recipe
discovery routes to `RAG`, and multi-step replanning requests route to `AGENT`.

The router is deterministic and runs before any model call. `AssistantService` invokes only the selected
typed handler, so a code-resolvable question never consumes an LLM request. Handler implementations are
injected, keeping the router independent from API authentication and persistence.

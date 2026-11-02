---
"@omnidotdev/providers": minor
---

Add an `@omnidotdev/providers/ai` module with `createSynapseClient`, the one blessed wrapper over the Synapse AI router's Anthropic-compatible `/v1/messages` endpoint (BYOK key override, cost estimation from a per-model rate when Synapse reports none, timeout, non-leaking errors). This is the text/LLM backend of the generation capability, so products (facet, keystone, creator) can converge on it instead of each hand-rolling a client.

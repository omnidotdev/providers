---
"@omnidotdev/providers": minor
---

Read the per-call cost the Synapse gateway reports. `createSynapseClient` now takes `usage.costCents` (real, pre-markup spend) from the gateway's `x-synapse-provider-cost-usd` response header, falling back to the list-rate estimate only when the header is absent, so spend breakers record what a call actually cost (including any model it failed over or escalated to). `usage.chargedUsd` and `usage.credits` expose the retail amount charged (`x-synapse-cost-usd`, `x-synapse-credits`). The header names are exported as `SYNAPSE_COST_HEADERS`. The never-emitted `usage.cost_cents` body field is no longer read

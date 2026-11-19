---
"@omnidotdev/providers": minor
---

The Synapse client passes `outputConfig` through as Anthropic `output_config` (structured output with a JSON schema, and effort), and each result now reports the model that actually served the call (`model`), why generation stopped (`stopReason`), and the gateway's charge for the call (`chargeId`, from the new `x-synapse-charge-id` header). The billing provider gains an optional `reverseCharge`, which asks Aether to refund one such charge in full, at most once, so a product never charges for a call it could not use.

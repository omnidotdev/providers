---
"@omnidotdev/providers": minor
---

Support product-scoped Synapse managed keys in `@omnidotdev/providers/ai`. `createSynapseProvisioner` accepts an optional `appId` (the product's Aether app slug) and `resolveKey` an optional third `billingEntity` argument (`{ entityType: "user" | "organization", entityId }`), both sent to Synapse's `provision-managed-key` endpoint so the gateway meters, checks entitlements, and charges usage against the product's app and entity instead of the user's own Synapse account. The scope is validated locally with the same rules Synapse enforces (a `SynapseScopeError` is thrown before any request), keys are cached per identity, app, and billing entity, and provisioning failures throw a `SynapseProvisionError` carrying the HTTP status. `createSynapseClient` now throws a `SynapseRequestError` carrying the gateway's HTTP `status` (e.g. 402 insufficient credits, 503 unavailable) with unchanged messages. Existing call signatures are unchanged.

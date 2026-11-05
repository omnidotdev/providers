---
"@omnidotdev/providers": minor
---

Add `createSynapseProvisioner` to the `@omnidotdev/providers/ai` module: the shared per-user Synapse managed-key provisioner. It lazily provisions and caches (per user, with a configurable TTL) a per-user Synapse key via Synapse's internal `provision-managed-key` endpoint, authorized by the fleet gateway secret, and labels keys with a configurable `source`. It replaces the identical hand-rolled copies in facet-api and creator-api so the fleet shares one implementation; `resolveKey` throws on a provisioning failure so a caller can fall back to its shared managed key.

---
"@omnidotdev/providers": minor
---

The Synapse client reports every charge a call settled as `chargeIds` (the gateway lists them comma-separated in `x-synapse-charge-id`, since a cascade bills each attempt). `chargeId` stays as the first one and is deprecated.

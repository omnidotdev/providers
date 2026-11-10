---
"@omnidotdev/providers": minor
---

Support multimodal messages in the shared Synapse `/v1/messages` client (`@omnidotdev/providers/ai`). `SynapseMessage.content` now accepts an array of content blocks (`SynapseContentBlock`: a `text` block or an `image` block with an inline base64 source) in addition to a plain string, matching the Anthropic `/v1/messages` shape and passed through to the gateway unchanged. Enables vision calls (e.g. handing a rendered image to a model for critique) while staying fully backward compatible with text-only turns.

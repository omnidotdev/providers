---
"@omnidotdev/providers": minor
---

Add an `@omnidotdev/providers/ai-client` module: the browser-side AI layer shared across products. It ships `createManagedAiAuth` (OAuth Authorization Code + PKCE sign-in for the managed generation path against Gatekeeper, with an injectable native/desktop flow and `prompt=login` by default), `createGatewayClient` (one-shot structured POST to a product AI gateway, bearer on the managed path, BYOK anonymous, generic user-safe errors), `classifyGatewayError` (map a gateway HTTP status onto a UI action), and a `useManagedAiAuth` React hook. Complements the server-side `./ai` Synapse client; streaming chat and the agentic tool loop run through TanStack AI, not this module.

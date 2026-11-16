---
"@omnidotdev/providers": patch
---

`createCheckoutSession` now takes the signed-in user's `accessToken` and sends it to Aether with the product's service key and `appId`. Aether requires the user on user checkout and only checks out for that user, so `metadata.externalId` must be their id. Pass the session's access token and set `serviceApiKey` on the provider

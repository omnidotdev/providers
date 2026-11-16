---
"@omnidotdev/providers": patch
---

The Aether billing provider now sends the product's service key with the signed-in user's token on checkout, subscription lookup, billing portal, cancel, and renew, so these work for products whose sign-in tokens are not issued for Aether. Set `serviceApiKey` on the provider to use them. Entitlement reads no longer send the user's token, which Aether never used there

---
"@omnidotdev/providers": patch
---

`createOidcClient` now finds the discovery document of an issuer that has a path (such as `https://auth.example.com/dex` or `https://sso.example.com/realms/acme`) by appending `/.well-known/openid-configuration` to the issuer, as OpenID Connect Discovery specifies. Root issuers resolve to the same URL as before.

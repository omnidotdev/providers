---
"@omnidotdev/providers": patch
---

`createOmniOAuthConfig` now points `userInfoUrl` at Gatekeeper's `/oauth2/userinfo` (the endpoint its discovery document advertises). The old `/userinfo` path returned 404, which only went unnoticed because sign-in reads the user from the ID token first

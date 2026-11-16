---
"@omnidotdev/providers": patch
---

feat(auth): add `createOrganizationHydrator` for workspace claims in slim tokens

Apps that read the workspace (organization) claim straight from the ID token
can now call `createOrganizationHydrator({ userinfoUrl }).resolve(claims, accessToken)`
to get the same rich `OrganizationClaim[]` whether the token carries the full
claim or ids only. Slim claims are hydrated from Gatekeeper userinfo with a short
per-user in-memory cache, the userinfo subject must match the token, and any
failure resolves to an empty list. `createGetAuth` now uses the same hydrator,
and its cache is bounded.

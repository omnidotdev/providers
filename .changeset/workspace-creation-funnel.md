---
"@omnidotdev/providers": minor
---

feat(react,auth): funnel workspace creation to the account hub + live org refresh

Add `workspacesUrl(accountBaseUrl)`, the canonical `${accountBaseUrl}/workspaces`
destination for the account hub's workspaces console (list, create, manage).
Products funnel users here instead of shipping their own creation dialogs, so
the flow, limits, and copy live in one place.

Add a per-request `forceRefreshOrgs` option to the `getAuth` call
(`getAuth(request, { forceRefreshOrgs: true })`). It bypasses the in-memory
organization display cache and re-hydrates the org list live from userinfo for
that request, writing the fresh result back so subsequent normal requests
benefit too. List surfaces (e.g. a Workspaces page) use it so a workspace just
created in the account portal reflects immediately instead of waiting out the
cache TTL.

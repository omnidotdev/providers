---
"@omnidotdev/providers": patch
---

fix(react): point `gatekeeperOrgManageUrl` at the account hub `@handle` org route

`gatekeeperOrgManageUrl` now returns `${accountBaseUrl}/@<slug>` instead of
`${accountBaseUrl}/organizations/<slug>`, converging products' org/member deep
links on the platform `@handle` grammar (the same shape every product uses to
address a workspace). The account hub serves this canonically and redirects the
legacy `/organizations/<slug>` and `?org=` forms, so consumers adopt the new URL
by bumping to this version at their own pace.

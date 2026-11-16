---
"@omnidotdev/providers": minor
---

feat(react): one-click account hub billing links and `hubCreditsUrl`

`hubPlanUrl` and `hubManageUrl` links now land on Stripe Checkout and the
billing portal in one click: the account hub creates the session
server-side and redirects straight to it, signing the user in first when
needed, and only stops on its own page when it needs the user (choosing a
workspace, a workspace they cannot buy for, an unknown plan, or a plan the
workspace already has). The link format is unchanged.

Add `hubCreditsUrl(accountBaseUrl, { product?, workspace?, pack? })` for
"Buy credits" actions: with a `pack` it goes straight to Stripe Checkout for
that credit pack, otherwise it opens the hub's pack picker.

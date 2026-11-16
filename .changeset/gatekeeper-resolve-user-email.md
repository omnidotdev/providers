---
"@omnidotdev/providers": minor
---

Add `GatekeeperOrgClient.resolveUserEmail(sub, serviceToken)`, which resolves an IdP subject to the user's email via Gatekeeper's service-only `/api/user/resolve-email` route (gated on the org-sync service token). This bridges the central consent ledger (keyed by subject) to email systems like Herald (keyed by address), so a consumer acting on a consent change can find the address to suppress or resubscribe.

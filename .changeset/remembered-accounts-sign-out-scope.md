---
"@omnidotdev/providers": minor
---

Account switching and sign-out helpers for apps with more than one Omni account on a browser:

- `useRememberedAccounts({ authBaseUrl })` (plus `fetchRememberedAccounts` and `otherRememberedAccounts`) in `providers/react` lists the accounts signed in on the browser for an account menu, from the identity provider's `GET /api/session/accounts`
- `switchAccountParams(loginHint?)` in `providers/auth` builds the sign-in parameters to switch accounts: the account picker, or straight to a remembered account by its handle
- `buildIdpLogoutUrl` takes `accounts: "current" | "all"` to sign out of only the app's account or of every account on the browser
- The account hub link helpers (`accountUrl`, `workspacesUrl`, `hubPlanUrl`, `hubManageUrl`, `hubCreditsUrl`, `hubInvoicesUrl`) take `loginHint`, the linking app's account subject, so the hub opens as the same account

---
"@omnidotdev/providers": minor
---

Add `useIdentitySync` (from `@omnidotdev/providers/react`), which keeps an app signed in as the same account as the identity provider: when the browser has switched accounts or signed out in another app, it calls the app's `onSwitched` or `onSignedOut` once. Network errors and outages never sign anyone out

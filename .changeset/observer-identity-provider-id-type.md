---
"@omnidotdev/providers": minor
---

`createObserverPlugin` accepts `identityProviderIdType` (`"UUID!"` or `"String!"`) for the type of `Observer.identityProviderId`. It defaults to `"UUID!"`, so existing APIs keep their schema; pass `"String!"` when the identity provider's subjects are not UUIDs, as a generic OpenID Connect provider's may be. Switching changes the API's schema, so clients that declare a `UUID` variable for it must update.

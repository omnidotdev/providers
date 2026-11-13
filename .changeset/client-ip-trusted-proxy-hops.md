---
"@omnidotdev/providers": minor
---

Add a `trustedProxyHops` option to `clientIp` / `clientIpKey` / `identityKey`. When set, the client IP is read from the right of `x-forwarded-for`, skipping the entries written by that many trusted appending proxies, so a client-supplied left-most entry can no longer mint a fresh rate-limit bucket per request. `x-real-ip` is ignored in this mode. Omitting the option keeps the legacy left-most behavior, which is spoofable behind any appending proxy; set it on every service whose proxy topology is known (e.g. `1` behind the Fractal gateway).

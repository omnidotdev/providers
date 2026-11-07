---
"@omnidotdev/providers": minor
---

Add shared trust/abuse primitives so products stop copy-pasting divergent, fail-open copies. `createModerator` is a Say Less client with a configurable failure stance (fail open by default, `failClosed: true` for public-serve paths) and a request timeout, replacing the ~10 identical `lib/moderation` copies that silently allow all content on any provider error. `identityKey` / `clientIpKey` / `clientIp` extract a stable rate-limit bucket key (Bearer JWT `sub`, else client IP) from any headers-like request, with a `trustProxy` option for services exposed directly to the internet where `x-forwarded-for` is spoofable. These lift Halo's identity-keyed limiter pattern into one place for fleet-wide reuse.

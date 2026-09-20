---
"@omnidotdev/providers": minor
---

Add `createTtlReadCache` to `@omnidotdev/providers/ecosystem`: a short-TTL
read-through cache with a shorter negative-result TTL and a bounded entry count,
for caching public ecosystem reads (products, creators) so a traffic burst
collapses onto a single upstream call. Complements the existing `createTtlCache`
and `createCoalescer`.

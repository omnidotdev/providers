---
"@omnidotdev/providers": minor
---

Add `@omnidotdev/providers/ecosystem`: a transport-agnostic broker plus injected
Halo (buy), Crystal (support), Herald (email capture), and Arbor (repo showcase)
connections, with TTL cache and request coalescing. Extracted from the Keystone
and Blink brokers so surface-rendering products share one fail-soft, link-out
degrading contract. App-integration glue (HTTP routes, browser runtime) stays in
each consumer.

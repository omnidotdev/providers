---
"@omnidotdev/providers": patch
---

fix(events): `submitApplication` rejects instead of throwing on missing identity

A missing required identity field (`product`/`applicationId`/`userId`) now
rejects the returned promise rather than throwing synchronously, so a caller's
fire-and-forget `.catch(...)` catches every failure and a submission emit can
never break the mutation it runs in.

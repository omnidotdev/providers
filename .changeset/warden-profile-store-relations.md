---
"@omnidotdev/providers": patch
---

Add Warden's `profile` and `store` types to `WARDEN_RELATIONS`

Warden's authorization model now defines `profile` (Blink, `creator`) and `store` (Halo, `owner`, `admin`, `editor`, `member`), so permission checks against those types type-check.

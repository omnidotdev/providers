---
"@omnidotdev/providers": minor
---

Add `generateLqip` (from `@omnidotdev/providers/media-server`): makes a tiny webp data URI from uploaded image bytes, for blur-up loading with thornberry `Image`'s `lqip`. It is best-effort (null when `sharp`, an optional peer, is missing or the bytes are not an image), so an upload never fails over its placeholder

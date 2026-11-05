---
"@omnidotdev/providers": patch
---

fix(db): define `__require` in the db bundle so it imports at runtime

The `@omnidotdev/providers/db` bundle imports `node:crypto`/`node:fs`/`node:path`
via plain ESM named imports. The build's `patchNodeInterop` step rewrote those to
`__require(...)` calls but only defined `__require` when Bun had injected its own
declaration, which this bundle did not have, so importing the module threw
`__require is not defined`. Define `__require` (same runtime-safe fallback the
patch already uses) whenever the rewritten calls are present without a
declaration.

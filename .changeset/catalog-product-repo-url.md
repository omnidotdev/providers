---
"@omnidotdev/providers": patch
---

feat(catalog): expose `repoUrl` on public catalog products

The public catalog query and `PublicProduct` now carry `repoUrl`, the canonical
public source repository for open-source products, sourced from omni-api.

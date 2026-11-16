---
"@omnidotdev/providers": minor
---

feat(react): link plan purchases and plan management to the account hub

Add `hubPlanUrl(accountBaseUrl, { product, plan, interval, workspace?, returnUrl? })`
and `hubManageUrl(accountBaseUrl, { product, workspace, returnUrl? })`, the
canonical account hub links for buying a product plan and managing a
workspace's plan. Products show their own pricing, but "Upgrade" and "Manage
billing" link here instead of running checkout or the billing portal
themselves.

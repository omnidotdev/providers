---
"@omnidotdev/providers": minor
---

billing: add `creditsFromCostCents` and `DEFAULT_CREDIT_COGS_MARKUP`, the one fleet definition of the model-cost-to-credit conversion. A credit is a retail unit (default 2.0 markup, ~50% gross margin), so AI usage is not metered at cost. Product services should adopt this instead of hand-rolling `ceil(costCents * markup)`.

---
"@omnidotdev/providers": minor
---

billing: add the shared credit display helpers so every product shows credits from the Aether balance instead of a local ledger. Aether stores the shared credit balance in retail USD (`numeric(12,4)`); a credit is a $0.01 display unit.

- `CENTS_PER_CREDIT`: the one definition of the credit unit (1 retail cent), now also used by `creditsFromCostCents`. `CREDITS_PER_USD` derives from it.
- `creditsFromBalanceUsd`: balance (decimal string or number) to whole credits, rounded down so a balance never overstates what the user can spend (overdrawn balances round toward more debt). Exact decimal math, no float drift (`"0.0150"` is 1, `0.29` is 29).
- `creditsFromChargeUsd`: an already-retail charge to whole credits, rounded up so a cost is never understated (same direction as `creditsFromCostCents`).
- `usdFromCredits`: whole credits to retail USD, the exact inverse.
- `formatCredits`: locale-grouped whole-number formatter (floors fractional input).

Malformed or non-finite input throws `TypeError`; results beyond the safe-integer range throw `RangeError`.

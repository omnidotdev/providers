---
"@omnidotdev/providers": minor
---

Show a workspace's account credit and link its invoices on a product's billing page. `billing.getAccountCredit(entityType, entityId, accessToken)` reads the credit Stripe applies to the workspace's next invoice (null when the user may not see it), `accountCreditDisplay` and `formatMinorAmount` format it, and `AccountCreditNotice` from `@omnidotdev/providers/react` renders "Account credit: $10.00, applied to your next invoice" with an Invoices link built by the new `hubInvoicesUrl`. Account credit is separate from prepaid Omni credits and is always labeled as such.

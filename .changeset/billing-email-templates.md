---
"@omnidotdev/providers": minor
---

feat(billing-emails): shared product-named billing email templates

Add a `@omnidotdev/providers/billing-emails` module: `productNameFromAppId`
(canonical catalog name normalization) plus branded, product-named templates
(payment failed, receipt, renewal reminder, canceled, trial, spend/credit
alerts). Single source of truth so every product renders the same billing
emails instead of each reimplementing them, letting products with their own
Stripe integration (Halo, Crystal) match Aether's branded emails.

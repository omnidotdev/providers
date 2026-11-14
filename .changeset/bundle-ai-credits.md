---
"@omnidotdev/providers": minor
---

Carry the bundle AI allowance in whole credits: `PublicBundle.monthlyAiCredits` (1 credit = $0.01 of retail AI spend) replaces `monthlyCreditAllowance` (retail USD), and the public catalog query reads omni-api's `monthlyAiCredits` instead of the deprecated USD field

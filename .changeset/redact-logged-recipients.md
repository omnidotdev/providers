---
"@omnidotdev/providers": patch
---

Stop logging email addresses. The Herald notification provider's `email sent` log now records the recipient count (`recipientCount`) and Herald's `messageId` instead of the recipient addresses (`to`). The auth helpers (`createGetAuth` and the organization hydrator) now log only an error's message on failure rather than the whole error object, since a failed ID token verification carries the decoded claims, including the user's email, as a property of the error.

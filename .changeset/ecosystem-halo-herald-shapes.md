---
"@omnidotdev/providers": patch
---

Fix the Halo and Herald ecosystem connections to match those services' real GraphQL schemas. Halo's `quickBuyCheckout` takes flat arguments (there is no `QuickBuyCheckoutInput`), so every brokered buy failed validation and fell back to a link-out. Herald's `addContact` returns `ContactPayload { contactId }`, not a nested `contact`, so every subscribe reported failure even when the contact was added.

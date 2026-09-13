---
"@omnidotdev/providers": minor
---

feat(events): add `submitApplication` helper for cross-product application submissions

Products submit applications into the Bifrost review queue by emitting a
`<product>.application.submitted` CloudEvent. Each product previously hand-wrote
the event type and `data` envelope, and duplicated the non-empty-handle rule
Bifrost enforces at ingest. `submitApplication(emit, submission)` now owns that
contract: it derives the event type from `product`, guarantees a non-empty
`handle` (falling back to the email local-part then the user id), and normalizes
the payload, so adding a product's application is one typed call.

Also exports `ApplicationSubmittedData` (the canonical emitted `data` shape, for
receivers to import) and `applicationSubmittedSchema` /
`applicationSubmittedSchemaRegistration(product, source)` so every product
registers the same validated `payloadSchema` (required identity fields, non-empty
`handle`) instead of a bare name with no wire validation.

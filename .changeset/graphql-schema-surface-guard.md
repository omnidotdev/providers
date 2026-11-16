---
"@omnidotdev/providers": minor
---

feat(graphql-surface): add a reviewed GraphQL surface guard

Add a `@omnidotdev/providers/graphql-surface` module for API test suites.
`assertSchemaSurface` loads a service's built schema and fails unless every
`Query`, `Mutation` and `Subscription` field is listed in a per-API policy with
the rule that authorizes it, so a newly generated table, column or custom
mutation cannot ship until someone reviews it. Entries for fields that no longer
exist fail too, keeping the policy an accurate record. `findGeneratedCrudMutations`
and `findTableReadFields` detect auto-generated CRUD and table reads by shape for
fail-closed assertions, and `listRootFields` bootstraps a policy. `graphql` is an
optional peer dependency and stays external, so schemas built by the service
pass the module's type checks.

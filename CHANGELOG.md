# @omnidotdev/providers

## 0.3.0

### Minor Changes

- [#90](https://github.com/omnidotdev/providers/pull/90) [`b7ce4f1`](https://github.com/omnidotdev/providers/commit/b7ce4f1bd295e643ced559beda1945a9c798f7b0) Thanks [@coopbri](https://github.com/coopbri)! - The Synapse client passes `outputConfig` through as Anthropic `output_config` (structured output with a JSON schema, and effort), and each result now reports the model that actually served the call (`model`), why generation stopped (`stopReason`), and the gateway's charge for the call (`chargeId`, from the new `x-synapse-charge-id` header). The billing provider gains an optional `reverseCharge`, which asks Aether to refund one such charge in full, at most once, so a product never charges for a call it could not use.

## 0.2.0

### Minor Changes

- [#79](https://github.com/omnidotdev/providers/pull/79) [`ac1d1a2`](https://github.com/omnidotdev/providers/commit/ac1d1a24ef3109ac6811b8ab424f54cb4a476ad3) Thanks [@coopbri](https://github.com/coopbri)! - Show a workspace's account credit and link its invoices on a product's billing page. `billing.getAccountCredit(entityType, entityId, accessToken)` reads the credit Stripe applies to the workspace's next invoice (null when the user may not see it), `accountCreditDisplay` and `formatMinorAmount` format it, and `AccountCreditNotice` from `@omnidotdev/providers/react` renders "Account credit: $10.00, applied to your next invoice" with an Invoices link built by the new `hubInvoicesUrl`. Account credit is separate from prepaid Omni credits and is always labeled as such.

- [#41](https://github.com/omnidotdev/providers/pull/41) [`2258070`](https://github.com/omnidotdev/providers/commit/2258070083046feb76a63e313351909f6585a590) Thanks [@coopbri](https://github.com/coopbri)! - Add an `@omnidotdev/providers/ai-client` module: the browser-side AI layer shared across products. It ships `createManagedAiAuth` (OAuth Authorization Code + PKCE sign-in for the managed generation path against Gatekeeper, with an injectable native/desktop flow and `prompt=login` by default), `createGatewayClient` (one-shot structured POST to a product AI gateway, bearer on the managed path, BYOK anonymous, generic user-safe errors), `classifyGatewayError` (map a gateway HTTP status onto a UI action), and a `useManagedAiAuth` React hook. Complements the server-side `./ai` Synapse client; streaming chat and the agentic tool loop run through TanStack AI, not this module.

- [#44](https://github.com/omnidotdev/providers/pull/44) [`5d71bbb`](https://github.com/omnidotdev/providers/commit/5d71bbb0cacd2d0808f4b781ceab1f5fdd710674) Thanks [@coopbri](https://github.com/coopbri)! - Add `createSynapseProvisioner` to the `@omnidotdev/providers/ai` module: the shared per-user Synapse managed-key provisioner. It lazily provisions and caches (per user, with a configurable TTL) a per-user Synapse key via Synapse's internal `provision-managed-key` endpoint, authorized by the fleet gateway secret, and labels keys with a configurable `source`. It replaces the identical hand-rolled copies in facet-api and creator-api so the fleet shares one implementation; `resolveKey` throws on a provisioning failure so a caller can fall back to its shared managed key.

- [#37](https://github.com/omnidotdev/providers/pull/37) [`f381fbc`](https://github.com/omnidotdev/providers/commit/f381fbcaf3eb876e7dd186e499b083049684c53b) Thanks [@coopbri](https://github.com/coopbri)! - Add an `@omnidotdev/providers/ai` module with `createSynapseClient`, the one blessed wrapper over the Synapse AI router's Anthropic-compatible `/v1/messages` endpoint (BYOK key override, cost estimation from a per-model rate when Synapse reports none, timeout, non-leaking errors). This is the text/LLM backend of the generation capability, so products (facet, keystone, creator) can converge on it instead of each hand-rolling a client.

- [#72](https://github.com/omnidotdev/providers/pull/72) [`2a3af65`](https://github.com/omnidotdev/providers/commit/2a3af65014e6a4d1d00f3bca3042c7b563e074ee) Thanks [@coopbri](https://github.com/coopbri)! - The Prism analytics client now carries first-touch campaign attribution: the whitelisted `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `ref` parameters from the URL a tab landed on are kept for that tab and attached to every event, so conversions (e.g. a signup several pages later) can be broken down by source and campaign. The rest of the query string is never sent.

- [#75](https://github.com/omnidotdev/providers/pull/75) [`f36cc7d`](https://github.com/omnidotdev/providers/commit/f36cc7dbeb8377d191742637672bb7e4a71c6678) Thanks [@coopbri](https://github.com/coopbri)! - The Prism analytics client accepts an optional `sanitizePath(pathname)` hook that rewrites the path before it is sent (e.g. `/c/abc123` to `/c/:id`) so ids and capability tokens in URLs never reach analytics storage; returning null drops the event.

- [`6bbede2`](https://github.com/omnidotdev/providers/commit/6bbede2d7836c0b5e2af9b0d476b28d84556993f) Thanks [@coopbri](https://github.com/coopbri)! - feat(billing-emails): shared product-named billing email templates

  Add a `@omnidotdev/providers/billing-emails` module: `productNameFromAppId`
  (canonical catalog name normalization) plus branded, product-named templates
  (payment failed, receipt, renewal reminder, canceled, trial, spend/credit
  alerts). Single source of truth so every product renders the same billing
  emails instead of each reimplementing them, letting products with their own
  Stripe integration (Halo, Crystal) match Aether's branded emails.

- [#62](https://github.com/omnidotdev/providers/pull/62) [`b2406ef`](https://github.com/omnidotdev/providers/commit/b2406ef9155d6e3305a76343eafa68cb3f34fce3) Thanks [@coopbri](https://github.com/coopbri)! - billing: add two shared AI cost-control primitives so every AI product contains free-tier abuse and degrades on billing outages the same way, instead of re-implementing them per service.
  - `createSpendBreaker` / `utcDayKey` / `SpendBreaker`: a daily, real-cents money-safety ceiling (independent of marked-up credits). Trips once the UTC-day ceiling is reached, resets at the day boundary, and disables cleanly at a non-positive ceiling. Products keep a durable DB-backed implementation of the `SpendBreaker` contract; this in-memory one is the test fake and DB-less fallback.
  - `createEntitlementCapResolver` / `createStaticCapResolver` / `CapResolver`: resolve an entity's monthly credit cap from its `included_credits` entitlement (generalized over product, entity type, and feature key), degrading to a static fallback on any outage, missing entitlement, or unparseable value, so a service never crashes and never hands out an unbounded cap.

- [#66](https://github.com/omnidotdev/providers/pull/66) [`6d4a24c`](https://github.com/omnidotdev/providers/commit/6d4a24ce52d2ec79b60d08884ec584fec5d87214) Thanks [@coopbri](https://github.com/coopbri)! - Carry the bundle AI allowance in whole credits: `PublicBundle.monthlyAiCredits` (1 credit = $0.01 of retail AI spend) replaces `monthlyCreditAllowance` (retail USD), and the public catalog query reads omni-api's `monthlyAiCredits` instead of the deprecated USD field

- [`b3062b0`](https://github.com/omnidotdev/providers/commit/b3062b085e9fbc3c194a627fa1cf6c216210d67e) Thanks [@coopbri](https://github.com/coopbri)! - Add a `trustedProxyHops` option to `clientIp` / `clientIpKey` / `identityKey`. When set, the client IP is read from the right of `x-forwarded-for`, skipping the entries written by that many trusted appending proxies, so a client-supplied left-most entry can no longer mint a fresh rate-limit bucket per request. `x-real-ip` is ignored in this mode. Omitting the option keeps the legacy left-most behavior, which is spoofable behind any appending proxy; set it on every service whose proxy topology is known (e.g. `1` behind the Fractal gateway).

- [#38](https://github.com/omnidotdev/providers/pull/38) [`61a06de`](https://github.com/omnidotdev/providers/commit/61a06de11c12239c9866e5e6543c082142991b7a) Thanks [@coopbri](https://github.com/coopbri)! - billing: add `creditsFromCostCents` and `DEFAULT_CREDIT_COGS_MARKUP`, the one fleet definition of the model-cost-to-credit conversion. A credit is a retail unit (default 2.0 markup, ~50% gross margin), so AI usage is not metered at cost. Product services should adopt this instead of hand-rolling `ceil(costCents * markup)`.

- [#64](https://github.com/omnidotdev/providers/pull/64) [`b6268cc`](https://github.com/omnidotdev/providers/commit/b6268cc743c639e76fe12ddb1b48cde466b093b4) Thanks [@coopbri](https://github.com/coopbri)! - billing: add the shared credit display helpers so every product shows credits from the Aether balance instead of a local ledger. Aether stores the shared credit balance in retail USD (`numeric(12,4)`); a credit is a $0.01 display unit.
  - `CENTS_PER_CREDIT`: the one definition of the credit unit (1 retail cent), now also used by `creditsFromCostCents`. `CREDITS_PER_USD` derives from it.
  - `creditsFromBalanceUsd`: balance (decimal string or number) to whole credits, rounded down so a balance never overstates what the user can spend (overdrawn balances round toward more debt). Exact decimal math, no float drift (`"0.0150"` is 1, `0.29` is 29).
  - `creditsFromChargeUsd`: an already-retail charge to whole credits, rounded up so a cost is never understated (same direction as `creditsFromCostCents`).
  - `usdFromCredits`: whole credits to retail USD, the exact inverse.
  - `formatCredits`: locale-grouped whole-number formatter (floors fractional input).

  Malformed or non-finite input throws `TypeError`; results beyond the safe-integer range throw `RangeError`.

- [#83](https://github.com/omnidotdev/providers/pull/83) [`372b925`](https://github.com/omnidotdev/providers/commit/372b925d2d1364c3538807f19e683b22ea72eaf7) Thanks [@coopbri](https://github.com/coopbri)! - Removed `gatekeeperDashboardUrl`. The identity dashboard is retired, so link to the account hub with `accountUrl` or `workspacesUrl` instead.

- [#31](https://github.com/omnidotdev/providers/pull/31) [`3e40f11`](https://github.com/omnidotdev/providers/commit/3e40f1173ecd767836f6e328d524d6a9cb34639a) Thanks [@coopbri](https://github.com/coopbri)! - Add `@omnidotdev/providers/ecosystem`: a transport-agnostic broker plus injected
  Halo (buy), Crystal (support), Herald (email capture), and Arbor (repo showcase)
  connections, with TTL cache and request coalescing. Extracted from the Keystone
  and Blink brokers so surface-rendering products share one fail-soft, link-out
  degrading contract. App-integration glue (HTTP routes, browser runtime) stays in
  each consumer.

- [#32](https://github.com/omnidotdev/providers/pull/32) [`b89fdaf`](https://github.com/omnidotdev/providers/commit/b89fdafb6ddf7024ec225b6a3c88e467d00f35c7) Thanks [@coopbri](https://github.com/coopbri)! - Add `createTtlReadCache` to `@omnidotdev/providers/ecosystem`: a short-TTL
  read-through cache with a shorter negative-result TTL and a bounded entry count,
  for caching public ecosystem reads (products, creators) so a traffic burst
  collapses onto a single upstream call. Complements the existing `createTtlCache`
  and `createCoalescer`.

- [#74](https://github.com/omnidotdev/providers/pull/74) [`4f5bee0`](https://github.com/omnidotdev/providers/commit/4f5bee0d0fc44368a27e558d750f3ffeb68aba67) Thanks [@coopbri](https://github.com/coopbri)! - Add email attachments to the notifications provider. `EmailParams` takes an optional `attachments` array of `EmailAttachment` (`filename`, `content` as raw bytes or a base64 string, optional `contentType`, and optional `contentId` for inline `cid:` images), and the Herald provider base64-encodes byte content and forwards the files on every recipient's message. `EmailAttachment` is exported from the root and `./notifications` entry points. Herald enforces the limits (at most 20 files and 25 MiB total per message, executable and script types refused); a refused attachment returns `{ success: false }` with Herald's reason and is not retried.

- [#73](https://github.com/omnidotdev/providers/pull/73) [`47f20b4`](https://github.com/omnidotdev/providers/commit/47f20b4497f3a4bb66739af6955a598867ba98ac) Thanks [@coopbri](https://github.com/coopbri)! - Add `GatekeeperOrgClient.resolveUserEmail(sub, serviceToken)`, which resolves an IdP subject to the user's email via Gatekeeper's service-only `/api/user/resolve-email` route (gated on the org-sync service token). This bridges the central consent ledger (keyed by subject) to email systems like Herald (keyed by address), so a consumer acting on a consent change can find the address to suppress or resubscribe.

- [#80](https://github.com/omnidotdev/providers/pull/80) [`12bdd32`](https://github.com/omnidotdev/providers/commit/12bdd329f861cd046e66656514c7e22c7b408036) Thanks [@coopbri](https://github.com/coopbri)! - feat(graphql-surface): add a reviewed GraphQL surface guard

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

- [#77](https://github.com/omnidotdev/providers/pull/77) [`befca41`](https://github.com/omnidotdev/providers/commit/befca41da6147a9f7762b22b26b76d1ad65811ae) Thanks [@coopbri](https://github.com/coopbri)! - feat(react): one-click account hub billing links and `hubCreditsUrl`

  `hubPlanUrl` and `hubManageUrl` links now land on Stripe Checkout and the
  billing portal in one click: the account hub creates the session
  server-side and redirects straight to it, signing the user in first when
  needed, and only stops on its own page when it needs the user (choosing a
  workspace, a workspace they cannot buy for, an unknown plan, or a plan the
  workspace already has). The link format is unchanged.

  Add `hubCreditsUrl(accountBaseUrl, { product?, workspace?, pack? })` for
  "Buy credits" actions: with a `pack` it goes straight to Stripe Checkout for
  that credit pack, otherwise it opens the hub's pack picker.

- [#71](https://github.com/omnidotdev/providers/pull/71) [`9cbd639`](https://github.com/omnidotdev/providers/commit/9cbd6396c1ff78e6db6f3d2d51efbb8c20e1ae1d) Thanks [@coopbri](https://github.com/coopbri)! - feat(react): link plan purchases and plan management to the account hub

  Add `hubPlanUrl(accountBaseUrl, { product, plan, interval, workspace?, returnUrl? })`
  and `hubManageUrl(accountBaseUrl, { product, workspace, returnUrl? })`, the
  canonical account hub links for buying a product plan and managing a
  workspace's plan. Products show their own pricing, but "Upgrade" and "Manage
  billing" link here instead of running checkout or the billing portal
  themselves.

- [#46](https://github.com/omnidotdev/providers/pull/46) [`5dc3159`](https://github.com/omnidotdev/providers/commit/5dc315939682ad5a01666c0e6df9336fa202982a) Thanks [@coopbri](https://github.com/coopbri)! - `runMigrations` now sets a Postgres `lock_timeout` (default 10s) on the migration connection, so a migration that must wait for a lock fails fast instead of queuing a lock request that head-of-line-blocks reads on the table. This guards against the failure mode where an `ALTER TABLE` queues its `ACCESS EXCLUSIVE` lock behind a long-running transaction (e.g. an abandoned `pg_dump` holding `ACCESS SHARE`) and silently blocks every read of that hot table until the holder clears. Configurable via the new `lockTimeoutMs` option (`0` disables it); the pure `buildMigrationPoolConfig` helper and `DEFAULT_LOCK_TIMEOUT_MS` are exported from `@omnidotdev/providers/db`.

- [#29](https://github.com/omnidotdev/providers/pull/29) [`931c90a`](https://github.com/omnidotdev/providers/commit/931c90a8cbe82d03234ca1a5c9e7aa130c75dfc3) Thanks [@coopbri](https://github.com/coopbri)! - feat(events): add `submitApplication` helper for cross-product application submissions

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

- [#84](https://github.com/omnidotdev/providers/pull/84) [`5c775ae`](https://github.com/omnidotdev/providers/commit/5c775aee2ebdef11a2ab5e91f5a610d8e43cb7f8) Thanks [@coopbri](https://github.com/coopbri)! - `createObserverPlugin` accepts `identityProviderIdType` (`"UUID!"` or `"String!"`) for the type of `Observer.identityProviderId`. It defaults to `"UUID!"`, so existing APIs keep their schema; pass `"String!"` when the identity provider's subjects are not UUIDs, as a generic OpenID Connect provider's may be. Switching changes the API's schema, so clients that declare a `UUID` variable for it must update.

- [#36](https://github.com/omnidotdev/providers/pull/36) [`896f4f1`](https://github.com/omnidotdev/providers/commit/896f4f170b948e89901c823ea037a41d77eb89ff) Thanks [@coopbri](https://github.com/coopbri)! - Add `@omnidotdev/providers/analytics`: a small, dependency-free Prism
  event-tracking client plus a React pageview hook. `createPrismClient({
collectorUrl, product })` enqueues events in memory and flushes them in batches
  to the Prism collector (`POST {collectorUrl}/collect`), using
  `navigator.sendBeacon` on page teardown and a keepalive fetch otherwise. It is a
  graceful no-op when `collectorUrl` is unset and SSR-safe (no-op outside a
  browser), and never sends an ip, cookie, or visitor identifier (the collector
  derives those server-side). `usePageview(client, pathname)` tracks a pageview on
  mount and on pathname change without coupling to any router.

- [#42](https://github.com/omnidotdev/providers/pull/42) [`f0061d8`](https://github.com/omnidotdev/providers/commit/f0061d829f60294185071e7a104d9cd300dac97b) Thanks [@coopbri](https://github.com/coopbri)! - feat(db): shared resilient migration runner

  Add a `@omnidotdev/providers/db` module exporting `runMigrations`: a drop-in
  replacement for the per-service drizzle migrate-on-boot script that self-heals
  migration-tracker drift. On an "already exists" error (a migration re-applied
  because `drizzle.__drizzle_migrations` fell behind the database, e.g. after a
  regen/squash, partial run, or restore) it reconciles the tracker to reality -
  probing each untracked migration in a rolled-back, side-effect-free transaction
  and recording the ones already applied - then retries once. A genuinely pending
  migration still applies; a real error still surfaces.

  This replaces a migrate script that every Elysia API service copied, where a
  plain `migrate()` hard-failed on re-apply and bricked boot (it took a service's
  deploys down for days). `drizzle-orm` and `pg` are optional peer dependencies,
  so non-database consumers are unaffected. An optional `afterMigrate` hook covers
  post-migration DDL drizzle-kit cannot emit (e.g. `FORCE ROW LEVEL SECURITY`).

- [#45](https://github.com/omnidotdev/providers/pull/45) [`4eee303`](https://github.com/omnidotdev/providers/commit/4eee303642a3f8b3a8307bab8c892d5aa0f783ac) Thanks [@coopbri](https://github.com/coopbri)! - Add shared trust/abuse primitives so products stop copy-pasting divergent, fail-open copies. `createModerator` is a Say Less client with a configurable failure stance (fail open by default, `failClosed: true` for public-serve paths) and a request timeout, replacing the ~10 identical `lib/moderation` copies that silently allow all content on any provider error. `identityKey` / `clientIpKey` / `clientIp` extract a stable rate-limit bucket key (Bearer JWT `sub`, else client IP) from any headers-like request, with a `trustProxy` option for services exposed directly to the internet where `x-forwarded-for` is spoofable. These lift Halo's identity-keyed limiter pattern into one place for fleet-wide reuse.

- [#59](https://github.com/omnidotdev/providers/pull/59) [`4431477`](https://github.com/omnidotdev/providers/commit/4431477d9a6d30396773114f98638d9918f84bf8) Thanks [@coopbri](https://github.com/coopbri)! - Support multimodal messages in the shared Synapse `/v1/messages` client (`@omnidotdev/providers/ai`). `SynapseMessage.content` now accepts an array of content blocks (`SynapseContentBlock`: a `text` block or an `image` block with an inline base64 source) in addition to a plain string, matching the Anthropic `/v1/messages` shape and passed through to the gateway unchanged. Enables vision calls (e.g. handing a rendered image to a model for critique) while staying fully backward compatible with text-only turns.

- [#67](https://github.com/omnidotdev/providers/pull/67) [`9084454`](https://github.com/omnidotdev/providers/commit/9084454c845dc0f3b630baf51c28e44fee9cfb23) Thanks [@coopbri](https://github.com/coopbri)! - Read the per-call cost the Synapse gateway reports. `createSynapseClient` now takes `usage.costCents` (real, pre-markup spend) from the gateway's `x-synapse-provider-cost-usd` response header, falling back to the list-rate estimate only when the header is absent, so spend breakers record what a call actually cost (including any model it failed over or escalated to). `usage.chargedUsd` and `usage.credits` expose the retail amount charged (`x-synapse-cost-usd`, `x-synapse-credits`). The header names are exported as `SYNAPSE_COST_HEADERS`. The never-emitted `usage.cost_cents` body field is no longer read

- [#65](https://github.com/omnidotdev/providers/pull/65) [`25a67e5`](https://github.com/omnidotdev/providers/commit/25a67e59c191999133808fc0c2f0bfbb3b7c4519) Thanks [@coopbri](https://github.com/coopbri)! - Support product-scoped Synapse managed keys in `@omnidotdev/providers/ai`. `createSynapseProvisioner` accepts an optional `appId` (the product's Aether app slug) and `resolveKey` an optional third `billingEntity` argument (`{ entityType: "user" | "organization", entityId }`), both sent to Synapse's `provision-managed-key` endpoint so the gateway meters, checks entitlements, and charges usage against the product's app and entity instead of the user's own Synapse account. The scope is validated locally with the same rules Synapse enforces (a `SynapseScopeError` is thrown before any request), keys are cached per identity, app, and billing entity, and provisioning failures throw a `SynapseProvisionError` carrying the HTTP status. `createSynapseClient` now throws a `SynapseRequestError` carrying the gateway's HTTP `status` (e.g. 402 insufficient credits, 503 unavailable) with unchanged messages. Existing call signatures are unchanged.

- [#40](https://github.com/omnidotdev/providers/pull/40) [`2a38a3c`](https://github.com/omnidotdev/providers/commit/2a38a3c62fc9791d68ebaabeb14e467a8784d733) Thanks [@coopbri](https://github.com/coopbri)! - feat(react,auth): funnel workspace creation to the account hub + live org refresh

  Add `workspacesUrl(accountBaseUrl)`, the canonical `${accountBaseUrl}/workspaces`
  destination for the account hub's workspaces console (list, create, manage).
  Products funnel users here instead of shipping their own creation dialogs, so
  the flow, limits, and copy live in one place.

  Add a per-request `forceRefreshOrgs` option to the `getAuth` call
  (`getAuth(request, { forceRefreshOrgs: true })`). It bypasses the in-memory
  organization display cache and re-hydrates the org list live from userinfo for
  that request, writing the fresh result back so subsequent normal requests
  benefit too. List surfaces (e.g. a Workspaces page) use it so a workspace just
  created in the account portal reflects immediately instead of waiting out the
  cache TTL.

### Patch Changes

- [#76](https://github.com/omnidotdev/providers/pull/76) [`5b7c10d`](https://github.com/omnidotdev/providers/commit/5b7c10dc8ba0e8253258740057e0e03c0058d944) Thanks [@coopbri](https://github.com/coopbri)! - Ship the built `sanitizePath` hook in the committed bundle, so git consumers of the Prism analytics client actually get it.

- [#51](https://github.com/omnidotdev/providers/pull/51) [`6a5cd7d`](https://github.com/omnidotdev/providers/commit/6a5cd7dbba20fce0833374d9e6810b1489212ce0) Thanks [@coopbri](https://github.com/coopbri)! - Bump better-auth to 1.7.18 (patch release on the 1.7 security line).

- [#47](https://github.com/omnidotdev/providers/pull/47) [`8681300`](https://github.com/omnidotdev/providers/commit/8681300038d011c7f49e31b395e5b1967e6e778e) Thanks [@coopbri](https://github.com/coopbri)! - Bump better-auth to 1.7.16 to patch security advisories (GHSA-965c-763c-88jm OAuth state usable as a magic link, GHSA-r4xp-prcw-77qf OAuth proxy impersonation, GHSA-44jh-23m7-hpcf drizzle-adapter rate-limit bypass).

- [#69](https://github.com/omnidotdev/providers/pull/69) [`01565f3`](https://github.com/omnidotdev/providers/commit/01565f30d159a352223619a2f6f2592becc1094a) Thanks [@coopbri](https://github.com/coopbri)! - The Aether billing provider now sends the product's service key with the signed-in user's token on checkout, subscription lookup, billing portal, cancel, and renew, so these work for products whose sign-in tokens are not issued for Aether. Set `serviceApiKey` on the provider to use them. Entitlement reads no longer send the user's token, which Aether never used there

- [#28](https://github.com/omnidotdev/providers/pull/28) [`2b3b56b`](https://github.com/omnidotdev/providers/commit/2b3b56ba28e554ffa3fa79b669478415fc8f29e3) Thanks [@coopbri](https://github.com/coopbri)! - feat(catalog): expose `repoUrl` on public catalog products

  The public catalog query and `PublicProduct` now carry `repoUrl`, the canonical
  public source repository for open-source products, sourced from omni-api.

- [#70](https://github.com/omnidotdev/providers/pull/70) [`5a2722f`](https://github.com/omnidotdev/providers/commit/5a2722ff6f2d0ded7b061be5466c4f7538818a53) Thanks [@coopbri](https://github.com/coopbri)! - `createCheckoutSession` now takes the signed-in user's `accessToken` and sends it to Aether with the product's service key and `appId`. Aether requires the user on user checkout and only checks out for that user, so `metadata.externalId` must be their id. Pass the session's access token and set `serviceApiKey` on the provider

- [#43](https://github.com/omnidotdev/providers/pull/43) [`5059c9d`](https://github.com/omnidotdev/providers/commit/5059c9de6ade5aa2bf2ea465154cf1a8a60d4161) Thanks [@coopbri](https://github.com/coopbri)! - fix(db): define `__require` in the db bundle so it imports at runtime

  The `@omnidotdev/providers/db` bundle imports `node:crypto`/`node:fs`/`node:path`
  via plain ESM named imports. The build's `patchNodeInterop` step rewrote those to
  `__require(...)` calls but only defined `__require` when Bun had injected its own
  declaration, which this bundle did not have, so importing the module threw
  `__require is not defined`. Define `__require` (same runtime-safe fallback the
  patch already uses) whenever the rewritten calls are present without a
  declaration.

- [#82](https://github.com/omnidotdev/providers/pull/82) [`f0ccaee`](https://github.com/omnidotdev/providers/commit/f0ccaee37ad8703efea486034b4bef2994ca3f32) Thanks [@coopbri](https://github.com/coopbri)! - fix(db): apply migrations skipped behind a later-stamped tracker row

  `runMigrations` now applies pending journal migrations that drizzle's migrator
  would skip forever. drizzle only runs entries newer than the tracker's newest
  `created_at`, so a tracker row stamped later than pending migrations (for
  example a ledger rebaseline that recorded `now()`) left them unapplied on every
  boot with no error. Such "shadowed" migrations (the untracked journal tail after
  the last tracked entry) are now applied before `migrate` runs, each in its own
  transaction with its tracker row stamped from the journal, under an advisory
  lock so replicas booting together do not double-apply. A shadowed migration
  whose objects already exist is recorded as applied, matching the existing
  reconcile path. Untracked entries that precede a tracked one (migrations edited
  after they were applied) are left alone. `findShadowedMigrations` is exported
  for callers that want to detect the drift without applying anything.

- [#68](https://github.com/omnidotdev/providers/pull/68) [`bcb81c2`](https://github.com/omnidotdev/providers/commit/bcb81c20eb0ecf3a849e5f6a2a8fedaf89ef84a2) Thanks [@coopbri](https://github.com/coopbri)! - Fix the Halo and Herald ecosystem connections to match those services' real GraphQL schemas. Halo's `quickBuyCheckout` takes flat arguments (there is no `QuickBuyCheckoutInput`), so every brokered buy failed validation and fell back to a link-out. Herald's `addContact` returns `ContactPayload { contactId }`, not a nested `contact`, so every subscribe reported failure even when the contact was added.

- [#19](https://github.com/omnidotdev/providers/pull/19) [`01372a3`](https://github.com/omnidotdev/providers/commit/01372a322627871eab4147d36080c695ee4e38b9) Thanks [@coopbri](https://github.com/coopbri)! - fix(events): paginate `listSubscriptions` so it returns every subscription

  The HTTP events provider's `listSubscriptions` fetched only the first page of the
  `/api/v1/subscriptions` endpoint (default page size 20), so in an org with more
  than 20 subscriptions it silently omitted the rest. Existence checks against the
  result (e.g. boot-time self-registration) then failed to find an existing
  subscription and tried to recreate it. It now pages through all results.

- [#86](https://github.com/omnidotdev/providers/pull/86) [`58c4ecc`](https://github.com/omnidotdev/providers/commit/58c4ecc0bf8ba985a491cb1f057b1cf5fc7c9dcb) Thanks [@coopbri](https://github.com/coopbri)! - fix(auth): forward the rotated session cookie with `appendResponseHeader`

  `getAuth` forwarded Better Auth's rotated account cookie with `getResponseHeaders().append`, but current TanStack Start returns a read-only snapshot from `getResponseHeaders()`, so the cookie never reached the response and the browser kept replaying the old refresh token. It now uses `appendResponseHeader`, falling back to the live headers only on older hosts without it. Apps that wired `forwardSetCookie: (raw) => getResponseHeaders().append(...)` themselves have the same bug: drop the override and let the default forward it.

- [#21](https://github.com/omnidotdev/providers/pull/21) [`5b1f5ef`](https://github.com/omnidotdev/providers/commit/5b1f5ef09676fe1f38b5d6d38de3476a0fb58e75) Thanks [@coopbri](https://github.com/coopbri)! - fix(auth): forward the rotated refresh-token cookie automatically in getAuth

  `getAuth` now forwards Better Auth's rotated (chunked) account cookie by default
  via TanStack Start's `getResponseHeaders().append`, instead of requiring every
  app to wire the `forwardSetCookie` hook. When the hook was omitted the browser
  kept replaying the pre-rotation refresh token; past the issuer's theft-detection
  grace window that tore down the token family, so token-derived data (e.g.
  `organizations`) came back empty until a full re-login. This is the exact
  "logged in long enough and the dashboard goes empty" bug, and it was silently
  present in every app that forgot the hook.

  `forwardSetCookie` is retained as an optional override (non-TanStack hosts,
  custom behavior); when supplied it wins, so apps that already wire it are
  unaffected and there is no double-forward. The TanStack import is a lazy,
  optional runtime peer: a consumer without it that supplies no override keeps the
  prior no-op rather than crashing.

- [#24](https://github.com/omnidotdev/providers/pull/24) [`e02f4dd`](https://github.com/omnidotdev/providers/commit/e02f4ddb194b8a04e08e81cff29ae399127b0d6d) Thanks [@coopbri](https://github.com/coopbri)! - fix(storage): harden the S3 storage provider against stale keep-alive socket hangs

  `S3StorageProvider` built its client with the default `@aws-sdk/client-s3` request handler, which pools keep-alive sockets and sets no aborting request timeout. Against an S3 store reached over a NAT/edge that silently idle-drops connections (Garage at `s3.omni.dev`), the pool fills with zombie sockets and every reuse hangs ~30s until the upstream gives up. This is the failure that took down halo-api media serving on 2026-09-01.

  The client is now built through `createResilientS3Client` (also exported for direct use): `keepAlive: false` so a socket is never reused, plus `throwOnRequestTimeout: true` with a `requestTimeout` (a plain `requestTimeout` on `@smithy/node-http-handler` v4 only warns and keeps hanging on Bun) and a `connectionTimeout`. Consumers pick up the fix on their next dependency bump.

- [#84](https://github.com/omnidotdev/providers/pull/84) [`5c775ae`](https://github.com/omnidotdev/providers/commit/5c775aee2ebdef11a2ab5e91f5a610d8e43cb7f8) Thanks [@coopbri](https://github.com/coopbri)! - `createOidcClient` now finds the discovery document of an issuer that has a path (such as `https://auth.example.com/dex` or `https://sso.example.com/realms/acme`) by appending `/.well-known/openid-configuration` to the issuer, as OpenID Connect Discovery specifies. Root issuers resolve to the same URL as before.

- [`cdbbff9`](https://github.com/omnidotdev/providers/commit/cdbbff96d2b0fa9422028e48598ca9e914e09286) Thanks [@coopbri](https://github.com/coopbri)! - fix(react): point `gatekeeperOrgManageUrl` at the account hub `@handle` org route

  `gatekeeperOrgManageUrl` now returns `${accountBaseUrl}/@<slug>` instead of
  `${accountBaseUrl}/organizations/<slug>`, converging products' org/member deep
  links on the platform `@handle` grammar (the same shape every product uses to
  address a workspace). The account hub serves this canonically and redirects the
  legacy `/organizations/<slug>` and `?org=` forms, so consumers adopt the new URL
  by bumping to this version at their own pace.

- [#87](https://github.com/omnidotdev/providers/pull/87) [`6415270`](https://github.com/omnidotdev/providers/commit/64152706c4d6124bd20176d585b290784d76caaf) Thanks [@coopbri](https://github.com/coopbri)! - Stop logging email addresses. The Herald notification provider's `email sent` log now records the recipient count (`recipientCount`) and Herald's `messageId` instead of the recipient addresses (`to`). The auth helpers (`createGetAuth` and the organization hydrator) now log only an error's message on failure rather than the whole error object, since a failed ID token verification carries the decoded claims, including the user's email, as a property of the error.

- [#30](https://github.com/omnidotdev/providers/pull/30) [`1673bff`](https://github.com/omnidotdev/providers/commit/1673bffa5fe683fd92ef17eb4b817ed49d5c3ea8) Thanks [@coopbri](https://github.com/coopbri)! - fix(events): `submitApplication` rejects instead of throwing on missing identity

  A missing required identity field (`product`/`applicationId`/`userId`) now
  rejects the returned promise rather than throwing synchronously, so a caller's
  fire-and-forget `.catch(...)` catches every failure and a submission emit can
  never break the mutation it runs in.

- [#88](https://github.com/omnidotdev/providers/pull/88) [`3945a43`](https://github.com/omnidotdev/providers/commit/3945a43919aabaee21a2ad4a31401cabc8a12cb7) Thanks [@coopbri](https://github.com/coopbri)! - Releases are now cut automatically and tagged on GitHub (`vX.Y.Z`, with a GitHub release and changelog), so consumers can pin a release with `github:omnidotdev/providers#vX.Y.Z` instead of a bare commit. The package is marked private and is not published to npm.

- [#85](https://github.com/omnidotdev/providers/pull/85) [`548ab46`](https://github.com/omnidotdev/providers/commit/548ab46197f12b21c999c62e02f173203c60b789) Thanks [@coopbri](https://github.com/coopbri)! - Add Warden's `profile` and `store` types to `WARDEN_RELATIONS`

  Warden's authorization model now defines `profile` (Blink, `creator`) and `store` (Halo, `owner`, `admin`, `editor`, `member`), so permission checks against those types type-check.

- [#78](https://github.com/omnidotdev/providers/pull/78) [`bbd1173`](https://github.com/omnidotdev/providers/commit/bbd1173908114300b9d5dd7b760194fa0fe56631) Thanks [@coopbri](https://github.com/coopbri)! - feat(auth): add `createOrganizationHydrator` for workspace claims in slim tokens

  Apps that read the workspace (organization) claim straight from the ID token
  can now call `createOrganizationHydrator({ userinfoUrl }).resolve(claims, accessToken)`
  to get the same rich `OrganizationClaim[]` whether the token carries the full
  claim or ids only. Slim claims are hydrated from Gatekeeper userinfo with a short
  per-user in-memory cache, the userinfo subject must match the token, and any
  failure resolves to an empty list. `createGetAuth` now uses the same hydrator,
  and its cache is bounded.

---
"@omnidotdev/providers": minor
---

billing: add two shared AI cost-control primitives so every AI product contains free-tier abuse and degrades on billing outages the same way, instead of re-implementing them per service.

- `createSpendBreaker` / `utcDayKey` / `SpendBreaker`: a daily, real-cents money-safety ceiling (independent of marked-up credits). Trips once the UTC-day ceiling is reached, resets at the day boundary, and disables cleanly at a non-positive ceiling. Products keep a durable DB-backed implementation of the `SpendBreaker` contract; this in-memory one is the test fake and DB-less fallback.
- `createEntitlementCapResolver` / `createStaticCapResolver` / `CapResolver`: resolve an entity's monthly credit cap from its `included_credits` entitlement (generalized over product, entity type, and feature key), degrading to a static fallback on any outage, missing entitlement, or unparseable value, so a service never crashes and never hands out an unbounded cap.

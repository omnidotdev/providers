/**
 * Omni ecosystem integration blocks: a transport-agnostic broker plus per-product
 * connections that a surface-rendering product embeds (Halo buy, Crystal support,
 * Herald email capture, Arbor repo showcase).
 *
 * Connections take their transport by injection (a `GraphqlRequest` function or a
 * fetch, plus URLs/keys), so a consumer wires its own client and can repoint at
 * Lattice's unified API in one place. The broker/coalesce/cache/fail-soft
 * contract is pure and transport-agnostic. App-integration glue (HTTP route
 * handlers, a browser runtime that wires `data-*` attributes) stays in each
 * consumer, since it depends on that app's server framework and DOM.
 *
 * Extracted from the Keystone and Blink brokers per
 * `plans/2026-09-19-omni-ecosystem-shared-lib-adr.md`.
 */

export {
  type ArborConfig,
  type ArborConnection,
  createArborConnection,
} from "./arborConnection";
export {
  type BrokerResult,
  type BuyRequest,
  type SubscribeRequest,
  type SupportRequest,
  resolveBuyCheckout,
  resolveSubscribe,
  resolveSupportCheckout,
} from "./broker";
export { createCoalescer } from "./coalesce";
export {
  type CrystalConfig,
  type CrystalConnection,
  createCrystalConnection,
} from "./crystalConnection";
export {
  type GraphqlRequest,
  type HaloConfig,
  type HaloConnection,
  createHaloConnection,
} from "./haloConnection";
export {
  type HeraldConfig,
  type HeraldConnection,
  createHeraldConnection,
} from "./heraldConnection";
export { type TtlCache, createTtlCache } from "./ttlCache";
export {
  ECOSYSTEM_READ_NEGATIVE_TTL_MS,
  ECOSYSTEM_READ_TTL_MS,
  type TtlReadCache,
  createTtlReadCache,
} from "./ttlReadCache";

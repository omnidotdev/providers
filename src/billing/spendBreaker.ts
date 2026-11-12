/**
 * Global daily spend breaker (shared fleet primitive).
 *
 * Tracks aggregate managed model spend per UTC day and trips once a configured
 * ceiling is reached, so a bug or abuse upstream cannot run spend past a known
 * bound. Real cents, never marked-up credits: this is the absolute money-safety
 * ceiling that sits BELOW a per-entity credit meter, and it is the right place
 * to contain free-tier sybil abuse (gate the free pool on it; exempt paid).
 *
 * The interface is injected so enforcement logic is testable with the in-memory
 * fake here (also a safe DB-less fallback). A product keeps its own durable,
 * Postgres-backed implementation of this same interface so the ceiling holds
 * across instances and restarts; this module owns the contract and the fake, so
 * every product trips on the same shape instead of hand-rolling its own.
 *
 * Lifted from facet-api's local breaker into @omnidotdev/providers so AI
 * products share one money-safety primitive. See
 * plans/2026-11-11-ai-credits-fleet-pattern-design.md
 */

/** Daily spend breaker contract. `nowMs` is injectable for deterministic tests. */
interface SpendBreaker {
  /** Whether spend has reached the ceiling for the current UTC day. */
  isTripped(nowMs?: number): Promise<boolean>;
  /** Add spend (US cents) to the current UTC day. */
  record(cents: number, nowMs?: number): Promise<void>;
  /** Spend recorded so far for the current UTC day, in US cents. */
  spentTodayCents(nowMs?: number): Promise<number>;
}

/** UTC day key, e.g. "2026-11-11". */
const utcDayKey = (nowMs: number): string =>
  new Date(nowMs).toISOString().slice(0, 10);

/**
 * Create an in-memory daily spend breaker. A ceiling of zero or less disables
 * the breaker (it never trips); the config layer never produces such a value.
 *
 * Process-local and reset on restart, so the ceiling does not hold across
 * instances: use a durable DB-backed implementation of {@link SpendBreaker}
 * wherever the database is available. This fake exists for tests and as a safe
 * fallback when the database is unreachable.
 */
const createSpendBreaker = (ceilingCents: number): SpendBreaker => {
  let day = "";
  let cents = 0;

  const rollover = (nowMs: number) => {
    const key = utcDayKey(nowMs);
    if (key !== day) {
      day = key;
      cents = 0;
    }
  };

  const now = () => Date.now();

  return {
    async spentTodayCents(nowMs = now()) {
      rollover(nowMs);
      return cents;
    },
    async record(amount, nowMs = now()) {
      rollover(nowMs);
      if (amount > 0) cents += amount;
    },
    async isTripped(nowMs = now()) {
      if (ceilingCents <= 0) return false;
      rollover(nowMs);
      return cents >= ceilingCents;
    },
  };
};

export type { SpendBreaker };
export { createSpendBreaker, utcDayKey };

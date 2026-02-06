import { log } from "./log";

type CircuitState = "closed" | "open" | "half-open";

type CircuitBreakerConfig = {
  /** Failure threshold before opening the circuit */
  threshold?: number;
  /** Cooldown in milliseconds before transitioning to half-open */
  cooldownMs?: number;
  /** Label for logging */
  label?: string;
};

const DEFAULT_THRESHOLD = 5;
const DEFAULT_COOLDOWN_MS = 30_000;

/**
 * Circuit breaker for external service calls.
 * Fails closed (throws) when circuit is open to prevent cascading failures.
 */
class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold: number;
  private readonly cooldownMs: number;
  private readonly label: string;

  constructor(config?: CircuitBreakerConfig) {
    this.threshold = config?.threshold ?? DEFAULT_THRESHOLD;
    this.cooldownMs = config?.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    this.label = config?.label ?? "circuit-breaker";
  }

  /**
   * Execute a function with circuit breaker protection.
   * @throws When circuit is open and cooldown has not elapsed
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.state = "half-open";
        log("info", this.label, "circuit half-open, attempting recovery");
      } else {
        throw new Error(`${this.label}: service unavailable (circuit open)`);
      }
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /** Check if the circuit is currently open */
  isOpen(): boolean {
    if (this.state !== "open") return false;

    if (Date.now() - this.lastFailureTime > this.cooldownMs) {
      this.state = "half-open";
      return false;
    }

    return true;
  }

  /** Manually reset the circuit to closed state */
  reset(): void {
    if (this.failures > 0 || this.state !== "closed") {
      log("info", this.label, "circuit closed");
    }
    this.failures = 0;
    this.state = "closed";
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = "open";
      log(
        "error",
        this.label,
        `circuit opened after ${this.failures} consecutive failures`,
      );
    }
  }
}

export { CircuitBreaker };

export type { CircuitBreakerConfig };

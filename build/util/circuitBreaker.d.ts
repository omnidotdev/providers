type CircuitBreakerConfig = {
    /** Failure threshold before opening the circuit */
    threshold?: number;
    /** Cooldown in milliseconds before transitioning to half-open */
    cooldownMs?: number;
    /** Label for logging */
    label?: string;
};
/**
 * Circuit breaker for external service calls.
 * Fails closed (throws) when circuit is open to prevent cascading failures.
 */
declare class CircuitBreaker {
    private state;
    private failures;
    private lastFailureTime;
    private readonly threshold;
    private readonly cooldownMs;
    private readonly label;
    constructor(config?: CircuitBreakerConfig);
    /**
     * Execute a function with circuit breaker protection.
     * @throws When circuit is open and cooldown has not elapsed
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    /** Check if the circuit is currently open */
    isOpen(): boolean;
    /** Manually reset the circuit to closed state */
    reset(): void;
    private recordFailure;
}
export { CircuitBreaker };
export type { CircuitBreakerConfig };

/**
 * In-flight de-duplication. Concurrent calls with the same key share one
 * promise, so a double-clicked buy button mints a single checkout session.
 * Mirrors Blink's `coalesceCheckout`.
 */
export declare const createCoalescer: <T>() => (key: string, fn: () => Promise<T>) => Promise<T>;

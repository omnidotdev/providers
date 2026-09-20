/**
 * In-flight de-duplication. Concurrent calls with the same key share one
 * promise, so a double-clicked buy button mints a single checkout session.
 * Mirrors Blink's `coalesceCheckout`.
 */
export const createCoalescer = <T>() => {
  const inflight = new Map<string, Promise<T>>();

  return (key: string, fn: () => Promise<T>): Promise<T> => {
    const existing = inflight.get(key);

    if (existing) return existing;

    const promise = fn().finally(() => inflight.delete(key));

    inflight.set(key, promise);

    return promise;
  };
};

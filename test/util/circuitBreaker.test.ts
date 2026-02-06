import { beforeEach, describe, expect, it } from "bun:test";

import { CircuitBreaker } from "../../src/util/circuitBreaker";

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      threshold: 3,
      cooldownMs: 100,
      label: "test",
    });
  });

  it("should execute functions in closed state", async () => {
    const result = await breaker.execute(async () => "ok");
    expect(result).toBe("ok");
  });

  it("should propagate errors but not open circuit below threshold", async () => {
    await expect(
      breaker.execute(async () => {
        throw new Error("fail");
      }),
    ).rejects.toThrow("fail");

    // Should still be closed (1 failure < 3 threshold)
    const result = await breaker.execute(async () => "still-ok");
    expect(result).toBe("still-ok");
  });

  it("should open after reaching threshold", async () => {
    for (let i = 0; i < 3; i++) {
      await breaker
        .execute(async () => {
          throw new Error("fail");
        })
        .catch(() => {});
    }

    // Circuit should be open now
    expect(breaker.isOpen()).toBe(true);

    await expect(
      breaker.execute(async () => "should-not-reach"),
    ).rejects.toThrow("service unavailable");
  });

  it("should transition to half-open after cooldown", async () => {
    for (let i = 0; i < 3; i++) {
      await breaker
        .execute(async () => {
          throw new Error("fail");
        })
        .catch(() => {});
    }

    expect(breaker.isOpen()).toBe(true);

    // Wait for cooldown
    await new Promise((r) => setTimeout(r, 120));

    expect(breaker.isOpen()).toBe(false);

    // Should allow one attempt (half-open)
    const result = await breaker.execute(async () => "recovered");
    expect(result).toBe("recovered");
  });

  it("should reset to closed on success after half-open", async () => {
    for (let i = 0; i < 3; i++) {
      await breaker
        .execute(async () => {
          throw new Error("fail");
        })
        .catch(() => {});
    }

    await new Promise((r) => setTimeout(r, 120));

    await breaker.execute(async () => "ok");

    // Should be fully closed again
    expect(breaker.isOpen()).toBe(false);
    const result = await breaker.execute(async () => "open-again");
    expect(result).toBe("open-again");
  });

  it("should reopen on failure during half-open", async () => {
    for (let i = 0; i < 3; i++) {
      await breaker
        .execute(async () => {
          throw new Error("fail");
        })
        .catch(() => {});
    }

    await new Promise((r) => setTimeout(r, 120));

    // Fail during half-open - circuit reopens immediately since
    // failure count is already at threshold
    await breaker
      .execute(async () => {
        throw new Error("fail-again");
      })
      .catch(() => {});

    expect(breaker.isOpen()).toBe(true);
  });

  it("should support manual reset", async () => {
    for (let i = 0; i < 3; i++) {
      await breaker
        .execute(async () => {
          throw new Error("fail");
        })
        .catch(() => {});
    }

    expect(breaker.isOpen()).toBe(true);
    breaker.reset();
    expect(breaker.isOpen()).toBe(false);
  });
});

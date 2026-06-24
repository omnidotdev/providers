import { describe, expect, it, mock } from "bun:test";

import {
  BILLING_WRITE_FAILED_EVENT,
  isPermissionError,
  probeWriteScope,
  safePaymentWrite,
} from "../../src/billing/safePaymentWrite";

import type { AlertEventsProvider } from "../../src/billing/safePaymentWrite";

const fakeEvents = () => {
  const emit = mock(async (_event: Record<string, unknown>) => ({}));
  return { provider: { emit } as unknown as AlertEventsProvider, emit };
};

describe("safePaymentWrite", () => {
  it("throws BEFORE running fn when idempotencyKey is missing", async () => {
    const fn = mock(async () => "ok");
    await expect(
      safePaymentWrite(fn, { idempotencyKey: "", operation: "charge" }),
    ).rejects.toThrow(/idempotencyKey/);
    expect(fn).not.toHaveBeenCalled();
  });

  it("returns the result on success (no alert)", async () => {
    const { provider, emit } = fakeEvents();
    const r = await safePaymentWrite(async () => ({ id: "ii_1" }), {
      idempotencyKey: "k1",
      operation: "charge",
      events: provider,
    });
    expect(r).toEqual({ id: "ii_1" });
    expect(emit).not.toHaveBeenCalled();
  });

  it("rethrows on failure AND emits the alert AND runs onError", async () => {
    const { provider, emit } = fakeEvents();
    const onError = mock((_err: unknown) => {});
    await expect(
      safePaymentWrite(
        async () => {
          throw new Error("boom");
        },
        {
          idempotencyKey: "k1",
          operation: "refund",
          events: provider,
          onError,
        },
      ),
    ).rejects.toThrow("boom");
    expect(emit).toHaveBeenCalledTimes(1);
    const event = emit.mock.calls[0][0] as Record<string, unknown>;
    expect(event.type).toBe(BILLING_WRITE_FAILED_EVENT);
    expect((event.data as Record<string, unknown>).operation).toBe("refund");
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("a failing alert emit never masks the original write error", async () => {
    const provider = {
      emit: async () => {
        throw new Error("vortex down");
      },
    } as unknown as AlertEventsProvider;
    await expect(
      safePaymentWrite(
        async () => {
          throw new Error("original");
        },
        { idempotencyKey: "k1", operation: "charge", events: provider },
      ),
    ).rejects.toThrow("original");
  });
});

describe("isPermissionError", () => {
  it("detects Stripe permission errors and 403s, but not validation", () => {
    expect(isPermissionError({ type: "StripePermissionError" })).toBe(true);
    expect(isPermissionError({ name: "AuthZPermissionError" })).toBe(true);
    expect(isPermissionError({ statusCode: 403 })).toBe(true);
    expect(isPermissionError({ status: 403 })).toBe(true);
    expect(isPermissionError({ statusCode: 400 })).toBe(false);
    expect(isPermissionError(new Error("nope"))).toBe(false);
  });
});

describe("probeWriteScope", () => {
  it("ok when the probe is authorized (validation 400)", async () => {
    const r = await probeWriteScope(async () => {
      throw { statusCode: 400, message: "missing customer" };
    });
    expect(r).toEqual({ ok: true });
  });

  it("permission:true when the key lacks the write scope", async () => {
    const r = await probeWriteScope(async () => {
      throw { type: "StripePermissionError" };
    });
    expect(r).toEqual({ ok: false, permission: true });
  });

  it("permission:false for an inconclusive (transient) error", async () => {
    const r = await probeWriteScope(async () => {
      throw new Error("ETIMEDOUT");
    });
    expect(r).toEqual({
      ok: false,
      permission: false,
      error: "ETIMEDOUT",
    });
  });
});

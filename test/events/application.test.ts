import { describe, expect, it } from "bun:test";

import Ajv from "ajv";

import {
  applicationSubmittedSchema,
  applicationSubmittedSchemaRegistration,
  submitApplication,
} from "../../src/events/application";

import type { EventInput } from "../../src/events/interface";

/** Capture the last emitted event without a real provider. */
const makeEmit = () => {
  const calls: EventInput[] = [];
  const emit = (event: EventInput) => {
    calls.push(event);
    return Promise.resolve({
      eventId: "evt_1",
      timestamp: new Date().toISOString(),
    });
  };
  return { emit, calls };
};

describe("submitApplication", () => {
  const base = {
    product: "arbor",
    applicationId: "app_1",
    userId: "user_1",
    handle: "octocat",
    email: "octocat@example.com",
  };

  it("derives the event type from product and sets subject to the application id", async () => {
    const { emit, calls } = makeEmit();
    await submitApplication(emit, base);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.type).toBe("arbor.application.submitted");
    expect(calls[0]?.subject).toBe("app_1");
  });

  it("emits the normalized data envelope", async () => {
    const { emit, calls } = makeEmit();
    await submitApplication(emit, {
      ...base,
      answers: { note: "hi" },
      nda: {
        accepted: true,
        version: "v1",
        acceptedAt: "2026-09-13T00:00:00Z",
      },
    });

    expect(calls[0]?.data).toEqual({
      product: "arbor",
      applicationId: "app_1",
      userId: "user_1",
      handle: "octocat",
      email: "octocat@example.com",
      answers: { note: "hi" },
      nda: {
        accepted: true,
        version: "v1",
        acceptedAt: "2026-09-13T00:00:00Z",
      },
    });
  });

  it("defaults answers to an empty object and nda to null", async () => {
    const { emit, calls } = makeEmit();
    await submitApplication(emit, base);

    expect(calls[0]?.data.answers).toEqual({});
    expect(calls[0]?.data.email).toBe("octocat@example.com");
    expect(calls[0]?.data.nda).toBeNull();
  });

  it("falls back to the email local-part when handle is blank", async () => {
    const { emit, calls } = makeEmit();
    await submitApplication(emit, { ...base, handle: "   " });

    expect(calls[0]?.data.handle).toBe("octocat");
  });

  it("falls back to the user id when handle and email are blank", async () => {
    const { emit, calls } = makeEmit();
    await submitApplication(emit, {
      product: "arbor",
      applicationId: "app_1",
      userId: "user_1",
      handle: null,
      email: null,
    });

    expect(calls[0]?.data.handle).toBe("user_1");
    expect(calls[0]?.data.email).toBeNull();
  });

  it("rejects (never throws synchronously) on a missing required identity field", async () => {
    const { emit, calls } = makeEmit();

    // returns a rejected promise rather than throwing synchronously, so a
    // caller's fire-and-forget .catch catches it and cannot break the mutation
    const missingProduct = submitApplication(emit, { ...base, product: "" });
    expect(missingProduct).toBeInstanceOf(Promise);

    await expect(missingProduct).rejects.toThrow(/product is required/);
    await expect(
      submitApplication(emit, { ...base, applicationId: "  " }),
    ).rejects.toThrow(/applicationId is required/);
    await expect(
      submitApplication(emit, { ...base, userId: "" }),
    ).rejects.toThrow(/userId is required/);

    expect(calls).toHaveLength(0);
  });
});

describe("applicationSubmittedSchema", () => {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(applicationSubmittedSchema);

  it("accepts a normalized payload", () => {
    const ok = validate({
      product: "arbor",
      applicationId: "app_1",
      userId: "user_1",
      handle: "octocat",
      email: "octocat@example.com",
      answers: {},
      nda: null,
    });
    expect(ok).toBe(true);
  });

  it("rejects a blank handle", () => {
    const ok = validate({
      product: "arbor",
      applicationId: "app_1",
      userId: "user_1",
      handle: "",
    });
    expect(ok).toBe(false);
  });

  it("rejects a missing identity field", () => {
    const ok = validate({
      product: "arbor",
      applicationId: "app_1",
      handle: "octocat",
    });
    expect(ok).toBe(false);
  });
});

describe("applicationSubmittedSchemaRegistration", () => {
  it("builds a registration carrying the shared payload schema", () => {
    const reg = applicationSubmittedSchemaRegistration("arbor", "omni.arbor");

    expect(reg.name).toBe("arbor.application.submitted");
    expect(reg.source).toBe("omni.arbor");
    expect(reg.enforcement).toBe("warn");
    expect(reg.payloadSchema).toBe(applicationSubmittedSchema);
  });

  it("allows promoting enforcement to strict", () => {
    const reg = applicationSubmittedSchemaRegistration(
      "thrivestream",
      "omni.thrivestream",
      "strict",
    );
    expect(reg.enforcement).toBe("strict");
  });
});

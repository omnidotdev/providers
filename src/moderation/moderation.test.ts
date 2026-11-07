import { describe, expect, test } from "bun:test";

import { createModerator } from "./moderation";

/** A fetch stub returning a Response-like object. */
const okJson = (body: unknown) =>
  (async () => ({
    ok: true,
    status: 200,
    json: async () => body,
  })) as unknown as typeof fetch;

const status = (code: number) =>
  (async () => ({
    ok: false,
    status: code,
    json: async () => ({}),
  })) as unknown as typeof fetch;

const throwing = (() => {
  throw new Error("network down");
}) as unknown as typeof fetch;

describe("createModerator", () => {
  test("allows everything when no provider URL is configured", async () => {
    const mod = createModerator({ failClosed: true });
    expect(await mod.moderateText("anything")).toEqual({ flagged: false });
  });

  test("allows empty/whitespace text without calling the provider", async () => {
    let called = false;
    const mod = createModerator({
      url: "http://say-less",
      fetchImpl: (() => {
        called = true;
        return Promise.reject(new Error("should not be called"));
      }) as unknown as typeof fetch,
    });
    expect(await mod.moderateText("   ")).toEqual({ flagged: false });
    expect(called).toBe(false);
  });

  test("flags content the provider flags", async () => {
    const mod = createModerator({
      url: "http://say-less",
      fetchImpl: okJson({ result: { flagged: true } }),
    });
    expect(await mod.moderateText("bad")).toEqual({ flagged: true });
  });

  test("passes content the provider clears", async () => {
    const mod = createModerator({
      url: "http://say-less",
      fetchImpl: okJson({ result: { flagged: false } }),
    });
    expect(await mod.moderateText("fine")).toEqual({ flagged: false });
  });

  test("fails OPEN by default on a non-200 response", async () => {
    const mod = createModerator({
      url: "http://say-less",
      fetchImpl: status(503),
    });
    expect(await mod.moderateText("x")).toEqual({ flagged: false });
  });

  test("fails CLOSED on a non-200 response when configured", async () => {
    const mod = createModerator({
      url: "http://say-less",
      failClosed: true,
      fetchImpl: status(503),
    });
    expect(await mod.moderateText("x")).toEqual({ flagged: true });
  });

  test("fails OPEN by default when the provider throws", async () => {
    const mod = createModerator({
      url: "http://say-less",
      fetchImpl: throwing,
    });
    expect(await mod.moderateText("x")).toEqual({ flagged: false });
  });

  test("fails CLOSED when the provider throws and configured closed", async () => {
    const mod = createModerator({
      url: "http://say-less",
      failClosed: true,
      fetchImpl: throwing,
    });
    expect(await mod.moderateText("x")).toEqual({ flagged: true });
  });

  test("fails CLOSED on timeout when configured", async () => {
    const hangs = ((_url: string, init?: { signal?: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new Error("aborted")),
        );
      })) as unknown as typeof fetch;
    const mod = createModerator({
      url: "http://say-less",
      failClosed: true,
      timeoutMs: 10,
      fetchImpl: hangs,
    });
    expect(await mod.moderateText("x")).toEqual({ flagged: true });
  });
});

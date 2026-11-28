import { describe, expect, it, mock } from "bun:test";

import { checkImage, screenImages } from "./screening";

import type { AttachedImage } from "./types";

/** A 1x1 PNG */
const IMAGE: AttachedImage = {
  mediaType: "image/png",
  data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
};

const respond = (body: unknown, status = 200) =>
  mock(async () => Response.json(body, { status }));

const config = (fetchImpl: typeof fetch) => ({
  url: "http://see-less.test",
  apiKey: "key",
  fetchImpl,
});

describe("checkImage", () => {
  it("approves only an explicit allow", async () => {
    const fetchImpl = respond({ verdict: "allow", categories: [] });
    const result = await checkImage(
      new Uint8Array([1]),
      "image/png",
      config(fetchImpl as unknown as typeof fetch),
    );

    expect(result.approved).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];

    expect(url).toBe("http://see-less.test/v1/moderate/image");
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe("key");
  });

  it("refuses a block or review, keeping the case for the server log", async () => {
    for (const verdict of ["block", "review"]) {
      const result = await checkImage(
        new Uint8Array([1]),
        "image/png",
        config(
          respond({
            verdict,
            categories: [{ category: "nsfw", score: 0.9 }],
            case_id: "case-1",
          }) as unknown as typeof fetch,
        ),
      );

      expect(result).toEqual({
        approved: false,
        verdict: verdict as "block" | "review",
        categories: ["nsfw"],
        caseId: "case-1",
      });
    }
  });

  it("fails closed on an outage after one retry", async () => {
    const fetchImpl = respond({ error: "starting" }, 503);
    const result = await checkImage(
      new Uint8Array([1]),
      "image/png",
      config(fetchImpl as unknown as typeof fetch),
    );

    expect(result).toMatchObject({ approved: false, verdict: "unavailable" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("fails closed on an unknown verdict or missing config", async () => {
    const odd = await checkImage(
      new Uint8Array([1]),
      "image/png",
      config(respond({ verdict: "maybe" }) as unknown as typeof fetch),
    );
    const unset = await checkImage(new Uint8Array([1]), "image/png", {
      url: undefined,
      apiKey: undefined,
    });

    expect(odd.approved).toBe(false);
    expect(unset.verdict).toBe("unavailable");
  });
});

describe("screenImages", () => {
  it("passes a turn with no images without asking", async () => {
    const fetchImpl = respond({ verdict: "block" });

    expect(
      await screenImages([], {
        config: config(fetchImpl as unknown as typeof fetch),
        production: true,
      }),
    ).toEqual({ ok: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("passes clean images", async () => {
    expect(
      await screenImages([IMAGE, IMAGE], {
        config: config(
          respond({ verdict: "allow" }) as unknown as typeof fetch,
        ),
        production: true,
      }),
    ).toEqual({ ok: true });
  });

  it("refuses a turn when any image is blocked or held for review, saying nothing internal", async () => {
    for (const verdict of ["block", "review"]) {
      const screening = await screenImages([IMAGE], {
        config: config(respond({ verdict }) as unknown as typeof fetch),
        production: true,
      });

      expect(screening).toMatchObject({
        ok: false,
        status: 422,
        code: "image_refused",
      });
      if (!screening.ok) {
        expect(screening.error).toContain("Nothing was charged");
        expect(screening.error).not.toMatch(/see less|moderat|verdict|nsfw/i);
      }
    }
  });

  it("fails closed in production without config, and lets images through in development", async () => {
    const unset = { url: undefined, apiKey: undefined };

    expect(
      await screenImages([IMAGE], { config: unset, production: true }),
    ).toMatchObject({
      ok: false,
      status: 503,
      code: "image_check_unavailable",
    });
    expect(
      await screenImages([IMAGE], { config: unset, production: false }),
    ).toEqual({ ok: true });
  });
});

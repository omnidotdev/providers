import { afterEach, describe, expect, it, mock } from "bun:test";

import { HeraldNotificationProvider } from "./herald";
import { createNotificationProvider } from "./index";

const API_URL = "https://herald.example.com";
const API_KEY = "test-key";
const DEFAULT_FROM = "noreply@omni.dev";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

/** Stub global fetch with a JSON response and capture the requests made. */
const stubFetch = (
  status: number,
  json: Record<string, unknown>,
): { calls: Array<{ url: string; init?: RequestInit }> } => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  globalThis.fetch = mock(
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });

      return new Response(JSON.stringify(json), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    },
  ) as unknown as typeof fetch;

  return { calls };
};

const makeProvider = () =>
  new HeraldNotificationProvider({
    apiKey: API_KEY,
    apiUrl: API_URL,
    defaultFrom: DEFAULT_FROM,
  });

describe("HeraldNotificationProvider.sendEmail", () => {
  it("returns success with messageId and posts to /messages with auth header", async () => {
    const { calls } = stubFetch(200, { id: "m_1", status: "queued" });
    const provider = makeProvider();

    const result = await provider.sendEmail({
      to: "user@example.com",
      subject: "Hello",
      body: "<p>Hi</p>",
      html: true,
    });

    expect(result).toEqual({ success: true, messageId: "m_1" });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(`${API_URL}/messages`);

    const headers = calls[0]?.init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${API_KEY}`);

    const sent = JSON.parse(calls[0]?.init?.body as string);
    expect(sent.to).toBe("user@example.com");
    expect(sent.from).toBe(DEFAULT_FROM);
    expect(sent.subject).toBe("Hello");
    expect(sent.html).toBe("<p>Hi</p>");
    // html bodies should not also carry a text part
    expect(sent.text).toBeUndefined();
  });

  it("returns failure without throwing on a non-2xx response", async () => {
    stubFetch(502, { error: "engine down" });
    const provider = makeProvider();

    const result = await provider.sendEmail({
      to: "user@example.com",
      subject: "Hello",
      body: "<p>Hi</p>",
      html: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("sends a plain-text body as both html and text", async () => {
    const { calls } = stubFetch(200, { id: "m_2", status: "queued" });
    const provider = makeProvider();

    const result = await provider.sendEmail({
      to: "user@example.com",
      subject: "Plain",
      body: "just text",
    });

    expect(result).toEqual({ success: true, messageId: "m_2" });

    const sent = JSON.parse(calls[0]?.init?.body as string);
    expect(sent.html).toBe("just text");
    expect(sent.text).toBe("just text");
  });

  it("sends one request per recipient for an array of recipients", async () => {
    const { calls } = stubFetch(200, { id: "m_3", status: "queued" });
    const provider = makeProvider();

    const result = await provider.sendEmail({
      to: ["a@example.com", "b@example.com"],
      subject: "Multi",
      body: "<p>Hi</p>",
      html: true,
    });

    expect(result.success).toBe(true);
    expect(calls).toHaveLength(2);
    expect(JSON.parse(calls[0]?.init?.body as string).to).toBe("a@example.com");
    expect(JSON.parse(calls[1]?.init?.body as string).to).toBe("b@example.com");
  });

  it("fails the whole send if any recipient fails", async () => {
    const calls: string[] = [];
    globalThis.fetch = mock(async (url: string | URL | Request) => {
      calls.push(String(url));
      const ok = calls.length === 1;
      return new Response(
        JSON.stringify(
          ok ? { id: "m_4", status: "queued" } : { error: "boom" },
        ),
        { status: ok ? 200 : 503 },
      );
    }) as unknown as typeof fetch;

    const provider = makeProvider();

    const result = await provider.sendEmail({
      to: ["a@example.com", "b@example.com"],
      subject: "Multi",
      body: "<p>Hi</p>",
      html: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe("HeraldNotificationProvider.sendEmailBatch", () => {
  it("maps each param to a send result", async () => {
    stubFetch(200, { id: "m_b", status: "queued" });
    const provider = makeProvider();

    const results = await provider.sendEmailBatch([
      { to: "a@example.com", subject: "A", body: "<p>a</p>", html: true },
      { to: "b@example.com", subject: "B", body: "<p>b</p>", html: true },
    ]);

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
  });
});

describe("createNotificationProvider herald branch", () => {
  it("returns a HeraldNotificationProvider when fully configured", () => {
    const provider = createNotificationProvider({
      provider: "herald",
      apiKey: API_KEY,
      apiUrl: API_URL,
      defaultFrom: DEFAULT_FROM,
    });

    expect(provider).toBeInstanceOf(HeraldNotificationProvider);
  });

  it("throws when apiKey is missing", () => {
    expect(() =>
      createNotificationProvider({
        provider: "herald",
        apiUrl: API_URL,
        defaultFrom: DEFAULT_FROM,
      }),
    ).toThrow(/apiKey/);
  });

  it("throws when apiUrl is missing", () => {
    expect(() =>
      createNotificationProvider({
        provider: "herald",
        apiKey: API_KEY,
        defaultFrom: DEFAULT_FROM,
      }),
    ).toThrow(/apiUrl/);
  });

  it("throws when defaultFrom is missing", () => {
    expect(() =>
      createNotificationProvider({
        provider: "herald",
        apiKey: API_KEY,
        apiUrl: API_URL,
      }),
    ).toThrow(/defaultFrom/);
  });
});

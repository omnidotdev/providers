import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";

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

  it("preserves a display-name From (does not strip it to a bare address)", async () => {
    const { calls } = stubFetch(200, { id: "m_from", status: "queued" });
    const provider = makeProvider();

    await provider.sendEmail({
      to: "Display Name <user@example.com>",
      from: "Omni <team@omni.dev>",
      subject: "Hello",
      body: "<p>Hi</p>",
      html: true,
    });

    const sent = JSON.parse(calls[0]?.init?.body as string);
    // from keeps its display name; recipient fields are still bare
    expect(sent.from).toBe("Omni <team@omni.dev>");
    expect(sent.to).toBe("user@example.com");
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

  it("forwards cc, bcc, reply-to, and headers (display names stripped)", async () => {
    const { calls } = stubFetch(200, { id: "m_cc", status: "queued" });
    const provider = makeProvider();

    await provider.sendEmail({
      to: "user@example.com",
      subject: "Hi",
      body: "<p>Hi</p>",
      html: true,
      cc: ["Cc Person <cc@example.com>"],
      bcc: ["bcc@example.com"],
      replyTo: "Support <reply@example.com>",
      headers: { "List-Unsubscribe": "<https://example.com/unsub>" },
    });

    const sent = JSON.parse(calls[0]?.init?.body as string);
    expect(sent.cc).toEqual(["cc@example.com"]);
    expect(sent.bcc).toEqual(["bcc@example.com"]);
    expect(sent.replyTo).toBe("reply@example.com");
    expect(sent.headers).toEqual({
      "List-Unsubscribe": "<https://example.com/unsub>",
    });
  });

  it("attaches cc/bcc only to the first message of a multi-recipient send", async () => {
    const { calls } = stubFetch(200, { id: "m_multi", status: "queued" });
    const provider = makeProvider();

    await provider.sendEmail({
      to: ["a@example.com", "b@example.com"],
      subject: "Multi",
      body: "<p>Hi</p>",
      html: true,
      cc: ["cc@example.com"],
    });

    expect(JSON.parse(calls[0]?.init?.body as string).cc).toEqual([
      "cc@example.com",
    ]);
    // the second recipient must not also receive the cc copy
    expect(JSON.parse(calls[1]?.init?.body as string).cc).toBeUndefined();
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

  it("strips recipient display names but keeps the From display name", async () => {
    const { calls } = stubFetch(200, { id: "m_5", status: "queued" });
    const provider = new HeraldNotificationProvider({
      apiKey: API_KEY,
      apiUrl: API_URL,
      defaultFrom: "Omni Orders <orders@send.omni.dev>",
    });

    const result = await provider.sendEmail({
      to: "Buyer Name <buyer@example.com>",
      subject: "Hello",
      body: "<p>Hi</p>",
      html: true,
    });

    expect(result.success).toBe(true);
    const body = JSON.parse(String(calls[0]?.init?.body)) as {
      from: string;
      to: string;
    };
    // from keeps its display name (Herald renders it in the header); recipients
    // are still reduced to bare addresses
    expect(body.from).toBe("Omni Orders <orders@send.omni.dev>");
    expect(body.to).toBe("buyer@example.com");
  });
});

describe("HeraldNotificationProvider attachments", () => {
  const PDF_BYTES = new TextEncoder().encode("%PDF-1.4 signed");
  const PDF_BASE64 = Buffer.from(PDF_BYTES).toString("base64");

  it("base64-encodes byte content and forwards type and content id", async () => {
    const { calls } = stubFetch(200, { id: "m_att", status: "queued" });
    const provider = makeProvider();

    const result = await provider.sendEmail({
      to: "signer@example.com",
      subject: "Signed",
      body: '<p>Done <img src="cid:logo"></p>',
      html: true,
      attachments: [
        {
          filename: "contract.pdf",
          content: PDF_BYTES,
          contentType: "application/pdf",
        },
        { filename: "logo.png", content: "iVBORw0KGgo=", contentId: "logo" },
      ],
    });

    expect(result).toEqual({ success: true, messageId: "m_att" });
    const sent = JSON.parse(calls[0]?.init?.body as string);
    expect(sent.attachments).toEqual([
      {
        filename: "contract.pdf",
        content: PDF_BASE64,
        contentType: "application/pdf",
      },
      { filename: "logo.png", content: "iVBORw0KGgo=", contentId: "logo" },
    ]);
  });

  it("encodes only the viewed bytes of a subarray", async () => {
    const { calls } = stubFetch(200, { id: "m_view", status: "queued" });
    const provider = makeProvider();
    const backing = new Uint8Array([0xff, ...PDF_BYTES, 0xff]);

    await provider.sendEmail({
      to: "signer@example.com",
      subject: "Signed",
      body: "<p>Done</p>",
      html: true,
      attachments: [
        {
          filename: "contract.pdf",
          content: backing.subarray(1, backing.length - 1),
        },
      ],
    });

    const sent = JSON.parse(calls[0]?.init?.body as string);
    expect(sent.attachments[0].content).toBe(PDF_BASE64);
  });

  it("sends the attachments to every recipient of a multi-recipient send", async () => {
    const { calls } = stubFetch(200, { id: "m_multi_att", status: "queued" });
    const provider = makeProvider();

    await provider.sendEmail({
      to: ["a@example.com", "b@example.com"],
      subject: "Signed",
      body: "<p>Done</p>",
      html: true,
      attachments: [{ filename: "contract.pdf", content: PDF_BYTES }],
    });

    for (const call of calls) {
      expect(JSON.parse(call.init?.body as string).attachments).toEqual([
        { filename: "contract.pdf", content: PDF_BASE64 },
      ]);
    }
  });

  it("omits the attachments field when there are none", async () => {
    const { calls } = stubFetch(200, { id: "m_none", status: "queued" });
    const provider = makeProvider();

    await provider.sendEmail({
      to: "user@example.com",
      subject: "Hi",
      body: "<p>Hi</p>",
      html: true,
      attachments: [],
    });

    expect(JSON.parse(calls[0]?.init?.body as string)).not.toHaveProperty(
      "attachments",
    );
  });

  it("does not retry a refused attachment and never logs its bytes", async () => {
    const { calls } = stubFetch(413, {
      error: "Attachments exceed the 25 MB total size limit",
    });
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});
    const infoSpy = spyOn(console, "info").mockImplementation(() => {});

    try {
      const result = await makeProvider().sendEmail({
        to: "user@example.com",
        subject: "Big",
        body: "<p>Big</p>",
        html: true,
        attachments: [{ filename: "contract.pdf", content: PDF_BYTES }],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("413");
      expect(result.error).toContain("total size limit");
      // a 4xx is permanent, so one attempt only
      expect(calls).toHaveLength(1);

      const logged = JSON.stringify([
        ...errorSpy.mock.calls,
        ...infoSpy.mock.calls,
      ]);
      expect(logged).not.toContain(PDF_BASE64);
    } finally {
      errorSpy.mockRestore();
      infoSpy.mockRestore();
    }
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

/**
 * Stub fetch with a sequence of outcomes, one per call. A number is an HTTP
 * status; "network" throws like a connection failure. Captures the call count.
 */
const stubFetchSequence = (
  outcomes: Array<number | "network">,
): { calls: () => number } => {
  let i = 0;
  globalThis.fetch = mock(async () => {
    const outcome = outcomes[Math.min(i, outcomes.length - 1)];
    i += 1;
    if (outcome === "network") throw new Error("ECONNREFUSED");
    return new Response(
      JSON.stringify(
        outcome >= 200 && outcome < 300
          ? { id: "m_ok", status: "queued" }
          : { error: "boom" },
      ),
      { status: outcome, headers: { "Content-Type": "application/json" } },
    );
  }) as unknown as typeof fetch;

  return { calls: () => i };
};

// fast retries (no real backoff delay) for tests
const makeRetryProvider = () =>
  new HeraldNotificationProvider({
    apiKey: API_KEY,
    apiUrl: API_URL,
    defaultFrom: DEFAULT_FROM,
    maxRetries: 2,
    retryBaseDelayMs: 0,
  });

const send = (provider: HeraldNotificationProvider) =>
  provider.sendEmail({
    to: "user@example.com",
    subject: "Hi",
    body: "<p>Hi</p>",
    html: true,
  });

describe("HeraldNotificationProvider retries", () => {
  it("retries a transient 5xx and then succeeds", async () => {
    const seq = stubFetchSequence([503, 503, 200]);
    const result = await send(makeRetryProvider());

    expect(result.success).toBe(true);
    expect(seq.calls()).toBe(3);
  });

  it("retries a network error and then succeeds", async () => {
    const seq = stubFetchSequence(["network", 200]);
    const result = await send(makeRetryProvider());

    expect(result.success).toBe(true);
    expect(seq.calls()).toBe(2);
  });

  it("does NOT retry a permanent 4xx (e.g. 422 suppressed/unverified)", async () => {
    const seq = stubFetchSequence([422]);
    const result = await send(makeRetryProvider());

    expect(result.success).toBe(false);
    expect(seq.calls()).toBe(1);
  });

  it("gives up after exhausting retries on persistent 5xx", async () => {
    const seq = stubFetchSequence([500, 500, 500, 500, 500]);
    const result = await send(makeRetryProvider());

    expect(result.success).toBe(false);
    // maxRetries 2 => 3 attempts total
    expect(seq.calls()).toBe(3);
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

describe("HeraldNotificationProvider logging", () => {
  const ADDRESSES = [
    "first@example.com",
    "second@example.com",
    "copy@example.com",
    "hidden@example.com",
    "reply@example.com",
  ];

  /** Capture every console sink the provider logger writes to. */
  const captureLogs = () => {
    const spies = [
      spyOn(console, "info").mockImplementation(() => {}),
      spyOn(console, "warn").mockImplementation(() => {}),
      spyOn(console, "error").mockImplementation(() => {}),
    ];

    return {
      entries: () =>
        spies.flatMap((spy) =>
          spy.mock.calls.map((args) => JSON.parse(String(args[0]))),
        ) as Array<Record<string, unknown>>,
      raw: () => JSON.stringify(spies.map((spy) => spy.mock.calls)),
      restore: () => {
        for (const spy of spies) spy.mockRestore();
      },
    };
  };

  it("logs the message id and recipient count, never an address", async () => {
    stubFetch(200, { id: "m_log", status: "queued" });
    const logs = captureLogs();

    try {
      const result = await makeProvider().sendEmail({
        to: ["First <first@example.com>", "second@example.com"],
        cc: ["copy@example.com"],
        bcc: ["hidden@example.com"],
        replyTo: "reply@example.com",
        subject: "Hello",
        body: "<p>Hi</p>",
        html: true,
      });

      expect(result.success).toBe(true);

      const sent = logs.entries().find((e) => e.message === "email sent");
      expect(sent).toBeDefined();
      expect(sent?.messageId).toBe("m_log");
      expect(sent?.recipientCount).toBe(2);
      expect(sent).not.toHaveProperty("to");

      const raw = logs.raw();
      for (const address of ADDRESSES) expect(raw).not.toContain(address);
      expect(raw).not.toContain("@example.com");
    } finally {
      logs.restore();
    }
  });

  it("never logs an address when the send fails", async () => {
    stubFetch(422, { error: "Recipient is suppressed" });
    const logs = captureLogs();

    try {
      const result = await makeProvider().sendEmail({
        to: "first@example.com",
        subject: "Hello",
        body: "<p>Hi</p>",
        html: true,
      });

      expect(result.success).toBe(false);
      expect(
        logs.entries().some((e) => e.message === "email send failed"),
      ).toBe(true);
      expect(logs.raw()).not.toContain("@example.com");
    } finally {
      logs.restore();
    }
  });
});

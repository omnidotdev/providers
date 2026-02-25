import { describe, expect, it } from "bun:test";

import { NoopNotificationProvider } from "../../src/notifications/noop";

describe("NoopNotificationProvider", () => {
  it("should return success with a messageId", async () => {
    const provider = new NoopNotificationProvider();

    const result = await provider.sendEmail({
      to: "test@example.com",
      subject: "Test",
      body: "Hello",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeTruthy();
    // Verify UUID format
    expect(result.messageId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("should return unique messageIds for each send", async () => {
    const provider = new NoopNotificationProvider();

    const a = await provider.sendEmail({
      to: "a@example.com",
      subject: "A",
      body: "Hello A",
    });
    const b = await provider.sendEmail({
      to: "b@example.com",
      subject: "B",
      body: "Hello B",
    });

    expect(a.messageId).not.toBe(b.messageId);
  });

  it("should handle sendEmailBatch", async () => {
    const provider = new NoopNotificationProvider();

    const results = await provider.sendEmailBatch([
      { to: "a@example.com", subject: "A", body: "Hello A" },
      { to: "b@example.com", subject: "B", body: "Hello B" },
      { to: "c@example.com", subject: "C", body: "Hello C" },
    ]);

    expect(results).toHaveLength(3);

    for (const result of results) {
      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
    }

    const ids = new Set(results.map((r) => r.messageId));
    expect(ids.size).toBe(3);
  });

  it("should report healthy", async () => {
    const provider = new NoopNotificationProvider();
    const health = await provider.healthCheck();

    expect(health.healthy).toBe(true);
    expect(health.message).toBe("noop");
  });

  it("should close without error", async () => {
    const provider = new NoopNotificationProvider();
    await expect(provider.close()).resolves.toBeUndefined();
  });
});

import { describe, expect, it } from "bun:test";

import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";

import { redactSessionToken } from "./redactSessionToken";

const db = { user: [], session: [], account: [], verification: [] };

const auth = betterAuth({
  baseURL: "http://localhost:3000",
  secret: "test-secret-that-is-long-enough-for-better-auth-0123456789",
  database: memoryAdapter(db),
  emailAndPassword: { enabled: true },
  plugins: [redactSessionToken()],
});

describe("redactSessionToken", () => {
  it("drops the token from get-session but keeps the session", async () => {
    const { headers } = await auth.api.signUpEmail({
      body: {
        email: "ada@example.com",
        password: "correct-horse-battery",
        name: "Ada",
      },
      returnHeaders: true,
    });
    const cookie = headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");

    const res = await auth.handler(
      new Request("http://localhost:3000/api/auth/get-session", {
        headers: { cookie },
      }),
    );
    const body = (await res.json()) as {
      session: Record<string, unknown>;
      user: { email: string };
    };

    expect(body.user.email).toBe("ada@example.com");
    expect(body.session.id).toBeDefined();
    expect(body.session).not.toHaveProperty("token");
  });
});

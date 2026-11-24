import { createAuthMiddleware } from "better-auth/api";

import type { BetterAuthPlugin } from "better-auth";

/**
 * Better Auth plugin that drops the session token from `/get-session`
 * responses. Better Auth includes it, so any script on an app's pages could
 * read it with `authClient.getSession()`, and the token is the value of the
 * httpOnly session cookie (holding it is holding the session). Apps never need
 * it in the browser. Server-side `auth.api.getSession` goes through the same
 * hook, so read the session row by `id`, never by `token`.
 *
 * Not for the identity provider itself, whose multi-session switching works by
 * session token.
 *
 * @example
 * betterAuth({ plugins: [genericOAuth(...), redactSessionToken()] })
 */
const redactSessionToken = () =>
  ({
    id: "omni-redact-session-token",
    hooks: {
      after: [
        {
          matcher: (ctx) => ctx.path === "/get-session",
          handler: createAuthMiddleware(async (ctx) => {
            const returned = ctx.context.returned as
              | { session?: Record<string, unknown> | null }
              | null
              | undefined;
            if (
              !returned ||
              typeof returned !== "object" ||
              returned instanceof Response ||
              !returned.session ||
              !("token" in returned.session)
            ) {
              return;
            }

            const { token: _token, ...session } = returned.session;
            return ctx.json({ ...returned, session });
          }),
        },
      ],
    },
  }) satisfies BetterAuthPlugin;

export { redactSessionToken };

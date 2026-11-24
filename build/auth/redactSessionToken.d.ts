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
declare const redactSessionToken: () => {
    id: "omni-redact-session-token";
    hooks: {
        after: {
            matcher: (ctx: import("better-auth").HookEndpointContext) => boolean;
            handler: import("better-call").Middleware<import("better-call").MiddlewareOptions, (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                session: {
                    [x: string]: unknown;
                };
            } | undefined>>;
        }[];
    };
};
export { redactSessionToken };

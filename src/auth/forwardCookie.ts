/**
 * The response helpers `getAuth` uses from `@tanstack/react-start/server`,
 * typed structurally because providers carries no TanStack dependency
 */
type StartServerHelpers = {
  appendResponseHeader?: (name: string, value: string | string[]) => void;
  getResponseHeaders?: () => Headers;
};

/**
 * Build the forwarder that puts a raw `Set-Cookie` header on the current
 * response, or null when the host offers no way to do it.
 *
 * `appendResponseHeader` is the supported write path: current TanStack Start
 * returns a read-only snapshot from `getResponseHeaders()`, so appending to
 * that silently drops the cookie. `getResponseHeaders` is kept only for older
 * hosts without `appendResponseHeader`, where it returned the live headers
 */
export const hostSetCookieForwarder = (
  server: StartServerHelpers,
): ((raw: string) => void) | null => {
  const { appendResponseHeader, getResponseHeaders } = server;

  if (typeof appendResponseHeader === "function") {
    return (raw) => appendResponseHeader("set-cookie", raw);
  }

  if (typeof getResponseHeaders === "function") {
    return (raw) => getResponseHeaders().append("set-cookie", raw);
  }

  return null;
};

import type { PrismClient } from "./client";
/**
 * Track a Prism pageview on mount and on every pathname change.
 *
 * The router dependency is intentionally kept out of the library: pass the
 * current pathname (e.g. from TanStack Router's `useLocation().pathname`) and
 * the hook fires `client.track("pageview")` whenever it changes. A ref guards
 * against duplicate tracks when the pathname is unchanged but the client
 * identity or an unrelated render churns the effect (and against React
 * StrictMode's double-invoked effects in development).
 *
 * @param client - A Prism client from `createPrismClient`
 * @param pathname - The current route pathname
 */
declare const usePageview: (client: PrismClient, pathname: string) => void;
export { usePageview };

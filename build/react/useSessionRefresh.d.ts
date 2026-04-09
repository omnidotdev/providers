/**
 * Periodically call a refresh function to keep the OAuth session alive.
 *
 * Calls `refreshFn` on a fixed interval so that the session cookie cache
 * stays warm and BA's built-in access token refresh fires before the token
 * expires during idle periods.
 *
 * The hook fires on a fixed interval **and** when the window regains
 * focus after being hidden for more than half the interval.
 *
 * @param refreshFn - Callback that triggers a server-side token refresh
 *   (typically the app's `fetchSession` server function)
 * @param intervalMs - Refresh interval in milliseconds (default: 4 min)
 */
declare function useSessionRefresh(refreshFn: () => void | Promise<unknown>, intervalMs?: number): void;
export { useSessionRefresh };

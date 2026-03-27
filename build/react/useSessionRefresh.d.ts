/**
 * Periodically call a refresh function to keep the OAuth session alive.
 *
 * Without periodic refresh the short-lived access token (~5 min) expires
 * while the user idles on a page, causing the next server call to fail
 * and logging the user out.
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

import { useEffect, useRef } from "react";

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
function useSessionRefresh(
  refreshFn: () => void | Promise<unknown>,
  intervalMs = 4 * 60 * 1000,
) {
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    const refresh = () => {
      lastRefresh.current = Date.now();
      refreshFn();
    };

    // Periodic refresh while the tab is active
    const id = setInterval(refresh, intervalMs);

    // Refresh on tab re-focus if enough time has passed
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;

      const elapsed = Date.now() - lastRefresh.current;
      if (elapsed > intervalMs / 2) {
        refresh();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshFn, intervalMs]);
}

export { useSessionRefresh };

import { useEffect, useRef } from "react";

/** The part of `fetch` the check uses */
type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/** What the identity provider says about the calling browser */
type IdentityCheck =
  /** The browser is signed in to the identity provider as the app's account */
  | "same"
  /** The browser is signed in as a different account than the app's */
  | "switched"
  /** The browser is signed out of the identity provider */
  | "signed-out"
  /** No answer (network error, outage, or an identity provider without the endpoint) */
  | "unknown";

/**
 * Ask the identity provider which account the browser is signed in as and
 * compare it with the app's own session. Anything but a clear answer is
 * "unknown", so an outage never signs anyone out
 * @param authBaseUrl - Identity provider base URL (e.g. https://identity.omni.dev)
 * @param subject - The identity provider subject the app's session belongs to
 * @param fetchImpl - Fetch implementation (tests)
 */
const checkIdentity = async (
  authBaseUrl: string,
  subject: string,
  fetchImpl: FetchLike = fetch,
): Promise<IdentityCheck> => {
  try {
    const res = await fetchImpl(
      `${authBaseUrl.replace(/\/+$/, "")}/api/session/current`,
      { credentials: "include", cache: "no-store" },
    );

    if (res.status === 401) return "signed-out";
    if (!res.ok) return "unknown";

    const body = (await res.json()) as { data?: { sub?: unknown } };
    const sub = body.data?.sub;
    if (typeof sub !== "string" || !sub) return "unknown";

    return sub === subject ? "same" : "switched";
  } catch {
    return "unknown";
  }
};

/** sessionStorage key marking the last time this tab acted on a mismatch */
const ACTED_KEY = "omni.identitySync.acted";

/** Act at most once a minute per subject, so a sign-in that lands on the same mismatch cannot loop */
const ACT_COOLDOWN_MS = 60 * 1000;

const recentlyActed = (subject: string): boolean => {
  try {
    const [actedFor, at] = (sessionStorage.getItem(ACTED_KEY) ?? "").split("|");
    return actedFor === subject && Date.now() - Number(at) < ACT_COOLDOWN_MS;
  } catch {
    return false;
  }
};

const markActed = (subject: string) => {
  try {
    sessionStorage.setItem(ACTED_KEY, `${subject}|${Date.now()}`);
  } catch {
    // Storage unavailable: the in-memory guard still covers this page
  }
};

interface UseIdentitySyncOptions {
  /** Identity provider base URL; the hook does nothing when unset */
  authBaseUrl: string | undefined;
  /**
   * Identity provider subject of the app's session (`identityProviderId`);
   * the hook does nothing while the app is signed out
   */
  subject: string | null | undefined;
  /** The browser signed out of the identity provider: end the app's session locally (not federated) */
  // biome-ignore lint/suspicious/noConfusingVoidType: callback may be sync or async
  onSignedOut: () => void | Promise<unknown>;
  /**
   * The browser is signed in to the identity provider as another account: sign
   * the app in again, which completes without a prompt as the active account
   */
  // biome-ignore lint/suspicious/noConfusingVoidType: callback may be sync or async
  onSwitched: () => void | Promise<unknown>;
  /** How often to check while the tab is visible (default 5 min) */
  intervalMs?: number;
}

/**
 * Keep the app signed in as the same account as the identity provider.
 *
 * Apps keep their own session after signing in, so without this a browser
 * can be signed in to two apps as two different accounts, or stay signed in to
 * one after signing out in another. Checks on mount, when the tab becomes
 * visible again, and on an interval while visible; on a mismatch it calls
 * `onSwitched` or `onSignedOut` once
 */
function useIdentitySync({
  authBaseUrl,
  subject,
  onSignedOut,
  onSwitched,
  intervalMs = 5 * 60 * 1000,
}: UseIdentitySyncOptions) {
  const callbacks = useRef({ onSignedOut, onSwitched });
  callbacks.current = { onSignedOut, onSwitched };

  useEffect(() => {
    if (!authBaseUrl || !subject) return;

    let isActing = false;
    let lastCheck = 0;

    const check = async () => {
      if (isActing || document.visibilityState !== "visible") return;
      // Focus events can arrive in bursts
      if (Date.now() - lastCheck < 30 * 1000) return;
      lastCheck = Date.now();

      const result = await checkIdentity(authBaseUrl, subject);
      if (result !== "switched" && result !== "signed-out") return;
      if (recentlyActed(subject)) return;

      isActing = true;
      markActed(subject);
      await (result === "switched"
        ? callbacks.current.onSwitched()
        : callbacks.current.onSignedOut());
    };

    void check();
    const id = setInterval(check, intervalMs);
    const onVisibilityChange = () => void check();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [authBaseUrl, subject, intervalMs]);
}

export type { IdentityCheck, UseIdentitySyncOptions };
export { checkIdentity, useIdentitySync };

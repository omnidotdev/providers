import { useEffect, useState } from "react";

/** The part of `fetch` the lookup uses */
type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * An account signed in on this browser, as the identity provider lists it for
 * an account menu. Never carries a session token or subject
 */
interface RememberedAccount {
  /**
   * Opaque handle for the account's session on this browser. Pass it as
   * `login_hint` with `prompt=select_account` to switch to it in one step
   * (see `switchAccountParams`)
   */
  handle: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

const isRememberedAccount = (value: unknown): value is RememberedAccount => {
  const account = value as Partial<RememberedAccount> | null;
  return typeof account?.handle === "string" && account.handle.length > 0;
};

/**
 * Fetch the accounts signed in on this browser from the identity provider's
 * `GET /api/session/accounts` (credentialed; the provider answers trusted
 * origins only). The active account comes first. Anything but a clear answer
 * (signed out, an outage, an identity provider without the endpoint) is an
 * empty list, so a menu simply shows no other accounts
 * @param authBaseUrl - Identity provider base URL (e.g. https://identity.omni.dev)
 * @param fetchImpl - Fetch implementation (tests)
 */
const fetchRememberedAccounts = async (
  authBaseUrl: string,
  fetchImpl: FetchLike = fetch,
): Promise<RememberedAccount[]> => {
  try {
    const res = await fetchImpl(
      `${authBaseUrl.replace(/\/+$/, "")}/api/session/accounts`,
      { credentials: "include", cache: "no-store" },
    );
    if (!res.ok) return [];

    const body = (await res.json()) as { data?: { accounts?: unknown } };
    const accounts = body.data?.accounts;
    if (!Array.isArray(accounts)) return [];

    return accounts.filter(isRememberedAccount).map((account) => ({
      handle: account.handle,
      name: account.name ?? null,
      email: account.email ?? null,
      image: account.image ?? null,
    }));
  } catch {
    return [];
  }
};

/**
 * The accounts other than `currentEmail`, for listing under the signed-in one.
 * Email is the only identifier the list shares with the app's own session
 * @param accounts - Every remembered account
 * @param currentEmail - The app's signed-in account's email
 */
const otherRememberedAccounts = (
  accounts: RememberedAccount[],
  currentEmail: string | null | undefined,
): RememberedAccount[] => {
  const current = currentEmail?.trim().toLowerCase();
  return accounts.filter(
    (account) => !current || account.email?.trim().toLowerCase() !== current,
  );
};

interface UseRememberedAccountsOptions {
  /** Identity provider base URL; the hook does nothing when unset */
  authBaseUrl: string | undefined;
  /** Look up only while the app is signed in (default true) */
  enabled?: boolean;
}

/**
 * The accounts signed in on this browser, for an account menu that lists the
 * other accounts inline (thornberry `AccountMenu` `accounts`). Looks up on
 * mount and when the tab becomes visible again (at most every 30 seconds), and
 * is empty while signed out or when the identity provider does not answer
 */
function useRememberedAccounts({
  authBaseUrl,
  enabled = true,
}: UseRememberedAccountsOptions): RememberedAccount[] {
  const [accounts, setAccounts] = useState<RememberedAccount[]>([]);

  useEffect(() => {
    if (!authBaseUrl || !enabled) {
      setAccounts([]);
      return;
    }

    let isCurrent = true;
    let lastLookup = 0;

    const lookUp = async () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastLookup < 30 * 1000) return;
      lastLookup = Date.now();

      const next = await fetchRememberedAccounts(authBaseUrl);
      if (isCurrent) setAccounts(next);
    };

    void lookUp();
    const onVisibilityChange = () => void lookUp();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isCurrent = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [authBaseUrl, enabled]);

  return accounts;
}

export type { RememberedAccount, UseRememberedAccountsOptions };
export {
  fetchRememberedAccounts,
  otherRememberedAccounts,
  useRememberedAccounts,
};

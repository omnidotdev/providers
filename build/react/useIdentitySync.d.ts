/** The part of `fetch` the check uses */
type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;
/** What the identity provider says about the calling browser */
type IdentityCheck = 
/** The browser is signed in to the identity provider as the app's account */
"same"
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
declare const checkIdentity: (authBaseUrl: string, subject: string, fetchImpl?: FetchLike) => Promise<IdentityCheck>;
interface UseIdentitySyncOptions {
    /** Identity provider base URL; the hook does nothing when unset */
    authBaseUrl: string | undefined;
    /**
     * Identity provider subject of the app's session (`identityProviderId`);
     * the hook does nothing while the app is signed out
     */
    subject: string | null | undefined;
    /** The browser signed out of the identity provider: end the app's session locally (not federated) */
    onSignedOut: () => void | Promise<unknown>;
    /**
     * The browser is signed in to the identity provider as another account: sign
     * the app in again, which completes without a prompt as the active account
     */
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
declare function useIdentitySync({ authBaseUrl, subject, onSignedOut, onSwitched, intervalMs, }: UseIdentitySyncOptions): void;
export type { IdentityCheck, UseIdentitySyncOptions };
export { checkIdentity, useIdentitySync };

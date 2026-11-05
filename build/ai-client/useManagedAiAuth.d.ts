import type { ManagedAiAuth } from "./session";
/** Reactive view of a ManagedAiAuth instance for a React component. */
export interface ManagedAiAuthState {
    /** Whether Omni sign-in is configured for this deployment. */
    isConfigured: boolean;
    /** Whether a valid (unexpired) access token is present. */
    isSignedIn: boolean;
    /** Start the PKCE login. */
    signIn: () => Promise<void>;
    /** Forget the stored token. */
    signOut: () => Promise<void>;
}
/**
 * Subscribe a component to a `ManagedAiAuth` instance's sign-in state, so it
 * re-renders on sign-in/out (in this tab or, via the storage event the auth
 * wires, another tab). The auth instance is created once per app with
 * `createManagedAiAuth` and passed in. The server snapshot is signed-out, so SSR
 * and the first client paint agree (hydration-safe)
 */
export declare const useManagedAiAuth: (auth: ManagedAiAuth) => ManagedAiAuthState;

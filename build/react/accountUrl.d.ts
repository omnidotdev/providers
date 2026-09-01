/**
 * Canonical Omni account-hub URL.
 *
 * The one place products link to for "manage account" (profile, security,
 * connected apps): the account hub at account.omni.dev, passed in as its base
 * URL so the host stays configurable per environment. Products link here
 * instead of inlining the account base, keeping the canonical location in a
 * single place, mirroring {@link gatekeeperDashboardUrl} for the identity
 * dashboard. Returns an empty string when no base is configured, so a missing
 * optional env degrades to an inert link rather than a thrown render
 */
export declare const accountUrl: (accountBaseUrl: string | undefined) => string;

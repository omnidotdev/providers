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
/**
 * Canonical workspaces console URL on the account hub
 * (`${accountBaseUrl}/workspaces`).
 *
 * Creating and managing a workspace is an identity concern owned by ONE
 * surface: the account hub's workspaces console, which lists, creates, and
 * manages workspaces across the ecosystem. Products funnel users here instead
 * of shipping their own creation dialogs, so the flow, limits, and copy live in
 * one place and a change of destination happens here rather than in every app.
 * Returns an empty string when no base is configured, so a missing optional env
 * degrades to an inert link rather than a thrown render, mirroring
 * {@link accountUrl}.
 */
export declare const workspacesUrl: (accountBaseUrl: string | undefined) => string;

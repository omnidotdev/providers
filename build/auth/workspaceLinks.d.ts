import type { WorkspaceLink } from "./types";
/**
 * Coerce a workspace's `links` into a well-formed `WorkspaceLink[]`.
 *
 * Gatekeeper stores `links` in a `text` column as a JSON string. Some delivery
 * paths parse it before sending (the JWT org claim, the public `by-slug`
 * endpoint) while others return the column verbatim (Better Auth's
 * `get-full-organization`), so a consumer that trusts the `WorkspaceLink[]`
 * type and calls `.map`/`.length` crashes when it is handed the raw string (the
 * `?? []` fallback only catches null/undefined, and a string has a truthy
 * `.length`). Normalize every shape here so callers always receive an array:
 * parse a JSON string, pass an array through, drop entries without a string
 * `url`, and default a missing `visibility` to "public" (legacy links predate
 * the field). Anything else becomes an empty array.
 */
export declare const normalizeWorkspaceLinks: (raw: unknown) => WorkspaceLink[];
/**
 * Normalize `links` and keep only the publicly visible ones. Use on any
 * anonymous or public surface so members-only links never leak to non-members.
 */
export declare const publicWorkspaceLinks: (raw: unknown) => WorkspaceLink[];

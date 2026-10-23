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
export const normalizeWorkspaceLinks = (raw: unknown): WorkspaceLink[] => {
  let value = raw;

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];

    const { url, title, visibility } = entry as Record<string, unknown>;
    if (typeof url !== "string") return [];

    return [
      {
        url,
        title: typeof title === "string" ? title : null,
        visibility: visibility === "members" ? "members" : "public",
      },
    ];
  });
};

/**
 * Normalize `links` and keep only the publicly visible ones. Use on any
 * anonymous or public surface so members-only links never leak to non-members.
 */
export const publicWorkspaceLinks = (raw: unknown): WorkspaceLink[] =>
  normalizeWorkspaceLinks(raw).filter((link) => link.visibility !== "members");

/**
 * High-level kind of a media file.
 *
 * Superset of what consuming apps support: backfeed only handles
 * `image` and `video`, runa adds a generic `file` kind for arbitrary
 * attachments (documents, archives, etc.)
 */
export type MediaKind = "image" | "video" | "file";

/** Per-kind constraint: maximum byte size and accepted MIME types */
export interface MediaKindLimit {
  /** Maximum allowed size in bytes */
  maxBytes: number;
  /** MIME types accepted for this kind */
  mimeTypes: readonly string[];
}

/** Per-kind media limits keyed by {@link MediaKind} */
export type MediaLimits = Record<MediaKind, MediaKindLimit>;

/** Minimal shape needed to validate a file (a browser `File` satisfies this) */
export interface ValidatableFile {
  /** MIME type, e.g. "image/png" */
  type: string;
  /** Size in bytes */
  size: number;
  /** Optional display name, used in error messages when present */
  name?: string;
}

/**
 * Result of validating a file, as a discriminated union both apps can adopt.
 * On success it carries the resolved {@link MediaKind}; on failure a
 * human-readable error message.
 */
export type ValidationResult =
  | { ok: true; kind: MediaKind }
  | { ok: false; error: string };

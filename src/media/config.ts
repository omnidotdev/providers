import type { MediaLimits } from "./types";

/** Bytes in a megabyte */
const MB = 1024 * 1024;

/** Default image MIME types (union of what backfeed and runa accept) */
export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

/** Default video MIME types (union of what backfeed and runa accept) */
export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

/**
 * Default non-media file MIME types.
 *
 * A representative whitelist of document, archive, and plain-text types.
 * Apps that need a broader set should pass their own {@link MediaLimits}
 * to the validation helpers.
 */
export const FILE_MIME_TYPES = [
  "application/pdf",
  "application/zip",
  "application/json",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

/**
 * Shared default media limits.
 *
 * Reconciles backfeed's and runa's numbers without shrinking either:
 * - image 20MB (both apps already use 20MB)
 * - video 50MB (both apps already use 50MB)
 * - file 25MB (matches runa's `file` kind; backfeed has no file kind so
 *   this only adds capability)
 */
export const DEFAULT_MEDIA_LIMITS: MediaLimits = {
  image: { maxBytes: 20 * MB, mimeTypes: IMAGE_MIME_TYPES },
  video: { maxBytes: 50 * MB, mimeTypes: VIDEO_MIME_TYPES },
  file: { maxBytes: 25 * MB, mimeTypes: FILE_MIME_TYPES },
};

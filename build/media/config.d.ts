import type { MediaLimits } from "./types";
/** Default image MIME types (union of what backfeed and runa accept) */
export declare const IMAGE_MIME_TYPES: readonly ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
/** Default video MIME types (union of what backfeed and runa accept) */
export declare const VIDEO_MIME_TYPES: readonly ["video/mp4", "video/webm", "video/quicktime"];
/**
 * Default non-media file MIME types.
 *
 * A representative whitelist of document, archive, and plain-text types.
 * Apps that need a broader set should pass their own {@link MediaLimits}
 * to the validation helpers.
 */
export declare const FILE_MIME_TYPES: readonly ["application/pdf", "application/zip", "application/json", "text/plain", "text/csv", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
/**
 * Shared default media limits.
 *
 * Reconciles backfeed's and runa's numbers without shrinking either:
 * - image 20MB (both apps already use 20MB)
 * - video 50MB (both apps already use 50MB)
 * - file 25MB (matches runa's `file` kind; backfeed has no file kind so
 *   this only adds capability)
 */
export declare const DEFAULT_MEDIA_LIMITS: MediaLimits;

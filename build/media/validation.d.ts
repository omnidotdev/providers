import type { MediaKind, MediaLimits, ValidatableFile, ValidationResult } from "./types";
/**
 * Resolve the {@link MediaKind} for a MIME type, or null when no configured
 * kind accepts it.
 * @param mimeType - MIME type to resolve, e.g. "image/png"
 * @param limits - Limits to resolve against (defaults to the shared limits)
 */
export declare const kindFromMimeType: (mimeType: string, limits?: MediaLimits) => MediaKind | null;
/**
 * Build the value for an `<input type="file" accept>` attribute, covering
 * every MIME type across all kinds.
 * @param limits - Limits to derive accepted types from (defaults to shared)
 */
export declare const acceptString: (limits?: MediaLimits) => string;
/**
 * Validate a candidate file against the configured limits.
 * Pure and framework-agnostic; a browser `File` satisfies the input shape.
 * @param file - File to validate ({ type, size, name? })
 * @param limits - Limits to validate against (defaults to the shared limits)
 * @returns A discriminated {@link ValidationResult}
 */
export declare const validateFile: (file: ValidatableFile, limits?: MediaLimits) => ValidationResult;
/** Human-readable byte size, e.g. "1.4 MB" */
export declare const formatBytes: (bytes: number) => string;

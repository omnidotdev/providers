import { DEFAULT_MEDIA_LIMITS } from "./config";

import type {
  MediaKind,
  MediaLimits,
  ValidatableFile,
  ValidationResult,
} from "./types";

/** Bytes in a megabyte */
const MB = 1024 * 1024;

/** Kinds in resolution order (image and video take precedence over file) */
const KIND_ORDER: readonly MediaKind[] = ["image", "video", "file"];

/**
 * Resolve the {@link MediaKind} for a MIME type, or null when no configured
 * kind accepts it.
 * @param mimeType - MIME type to resolve, e.g. "image/png"
 * @param limits - Limits to resolve against (defaults to the shared limits)
 */
export const kindFromMimeType = (
  mimeType: string,
  limits: MediaLimits = DEFAULT_MEDIA_LIMITS,
): MediaKind | null => {
  for (const kind of KIND_ORDER) {
    if (limits[kind].mimeTypes.includes(mimeType)) return kind;
  }

  return null;
};

/**
 * Build the value for an `<input type="file" accept>` attribute, covering
 * every MIME type across all kinds.
 * @param limits - Limits to derive accepted types from (defaults to shared)
 */
export const acceptString = (
  limits: MediaLimits = DEFAULT_MEDIA_LIMITS,
): string => KIND_ORDER.flatMap((kind) => limits[kind].mimeTypes).join(",");

/**
 * Validate a candidate file against the configured limits.
 * Pure and framework-agnostic; a browser `File` satisfies the input shape.
 * @param file - File to validate ({ type, size, name? })
 * @param limits - Limits to validate against (defaults to the shared limits)
 * @returns A discriminated {@link ValidationResult}
 */
export const validateFile = (
  file: ValidatableFile,
  limits: MediaLimits = DEFAULT_MEDIA_LIMITS,
): ValidationResult => {
  const label = file.name ?? "file";

  if (file.size <= 0) return { ok: false, error: `${label}: file is empty` };

  const kind = kindFromMimeType(file.type, limits);
  if (!kind) return { ok: false, error: `${label}: unsupported file type` };

  const { maxBytes } = limits[kind];
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `${label}: exceeds the ${Math.round(maxBytes / MB)}MB ${kind} limit`,
    };
  }

  return { ok: true, kind };
};

/** Human-readable byte size, e.g. "1.4 MB" */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unit]}`;
};

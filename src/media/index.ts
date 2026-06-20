export {
  DEFAULT_MEDIA_LIMITS,
  FILE_MIME_TYPES,
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
} from "./config";
export {
  acceptString,
  formatBytes,
  kindFromMimeType,
  validateFile,
} from "./validation";

export type {
  MediaKind,
  MediaKindLimit,
  MediaLimits,
  ValidatableFile,
  ValidationResult,
} from "./types";

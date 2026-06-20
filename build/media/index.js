// src/media/config.ts
var MB = 1024 * 1024;
var IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif"
];
var VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime"
];
var FILE_MIME_TYPES = [
  "application/pdf",
  "application/zip",
  "application/json",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];
var DEFAULT_MEDIA_LIMITS = {
  image: { maxBytes: 20 * MB, mimeTypes: IMAGE_MIME_TYPES },
  video: { maxBytes: 50 * MB, mimeTypes: VIDEO_MIME_TYPES },
  file: { maxBytes: 25 * MB, mimeTypes: FILE_MIME_TYPES }
};
// src/media/validation.ts
var MB2 = 1024 * 1024;
var KIND_ORDER = ["image", "video", "file"];
var kindFromMimeType = (mimeType, limits = DEFAULT_MEDIA_LIMITS) => {
  for (const kind of KIND_ORDER) {
    if (limits[kind].mimeTypes.includes(mimeType))
      return kind;
  }
  return null;
};
var acceptString = (limits = DEFAULT_MEDIA_LIMITS) => KIND_ORDER.flatMap((kind) => limits[kind].mimeTypes).join(",");
var validateFile = (file, limits = DEFAULT_MEDIA_LIMITS) => {
  const label = file.name ?? "file";
  if (file.size <= 0)
    return { ok: false, error: `${label}: file is empty` };
  const kind = kindFromMimeType(file.type, limits);
  if (!kind)
    return { ok: false, error: `${label}: unsupported file type` };
  const { maxBytes } = limits[kind];
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `${label}: exceeds the ${Math.round(maxBytes / MB2)}MB ${kind} limit`
    };
  }
  return { ok: true, kind };
};
var formatBytes = (bytes) => {
  if (bytes < 1024)
    return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unit]}`;
};
export {
  validateFile,
  kindFromMimeType,
  formatBytes,
  acceptString,
  VIDEO_MIME_TYPES,
  IMAGE_MIME_TYPES,
  FILE_MIME_TYPES,
  DEFAULT_MEDIA_LIMITS
};

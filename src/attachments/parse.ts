import { DEFAULT_ATTACHMENT_LIMITS, DOCUMENT_TYPES } from "./types";

import type {
  AttachedDocument,
  AttachedImage,
  AttachmentLimits,
  AttachmentRefusal,
  DocumentType,
  ImageType,
} from "./types";

export type ImagesParse =
  | { ok: true; images: AttachedImage[] }
  | AttachmentRefusal;

export type DocumentsParse =
  | { ok: true; documents: AttachedDocument[] }
  | AttachmentRefusal;

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/** Decoded byte length of base64 text */
export const decodedLength = (data: string): number =>
  Math.floor((data.length * 3) / 4) -
  (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);

/**
 * The image type its first bytes show, whatever the request claims, so a
 * mislabeled or non-image upload never reaches a model
 * @param bytes - The start of the file (12 bytes is enough).
 * @returns The image type, or null when it is not a PNG, JPEG, GIF, or WebP.
 */
export const sniffImageType = (bytes: Uint8Array): ImageType | null => {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end));

  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (ascii(0, 4) === "GIF8") return "image/gif";

  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";

  return null;
};

const sniffBase64 = (data: string): ImageType | null =>
  sniffImageType(new Uint8Array(Buffer.from(data.slice(0, 24), "base64")));

const refuse = (code: string, error: string): AttachmentRefusal => ({
  ok: false,
  code,
  error,
});

/** Bytes as people read them: "2 MB", "200 KB" */
const size = (bytes: number): string =>
  bytes >= 1_000_000
    ? `${Math.round(bytes / 100_000) / 10} MB`
    : `${Math.round(bytes / 1000)} KB`;

/** A file name safe to show a model: no paths, control characters, or markup */
export const cleanFileName = (name: unknown): string => {
  const base =
    typeof name === "string"
      ? (name.split(/[\\/]/).pop() ?? "")
          // biome-ignore lint/suspicious/noControlCharactersInRegex: strip control characters from an untrusted name
          .replace(/[\u0000-\u001f\u007f<>"]/g, "")
          .trim()
      : "";

  return base.slice(0, 120) || "attachment";
};

/**
 * Validate a request's attached images: at most `maxImages`, each a PNG,
 * JPEG, WebP, or GIF (checked by its bytes, not its label) of at most
 * `maxImageBytes`. Absent means none
 * @param input - The request's images, untrusted.
 * @param limits - Limits to apply instead of the shared defaults.
 */
export const parseImages = (
  input: unknown,
  limits: Partial<AttachmentLimits> = {},
): ImagesParse => {
  const { maxImages, maxImageBytes } = {
    ...DEFAULT_ATTACHMENT_LIMITS,
    ...limits,
  };

  if (input === undefined || input === null) return { ok: true, images: [] };

  if (!Array.isArray(input)) {
    return refuse("invalid_images", "Attached images couldn't be read.");
  }

  if (input.length > maxImages) {
    return refuse(
      "too_many_images",
      `Attach up to ${maxImages} images to one message.`,
    );
  }

  const images: AttachedImage[] = [];

  for (const item of input) {
    const { mediaType, data, name } = (item ?? {}) as {
      mediaType?: unknown;
      data?: unknown;
      name?: unknown;
    };

    if (typeof data !== "string" || !data || !BASE64.test(data)) {
      return refuse("invalid_images", "Attached images couldn't be read.");
    }

    if (decodedLength(data) > maxImageBytes) {
      return refuse(
        "image_too_large",
        `Each image can be up to ${size(maxImageBytes)}. Try a smaller screenshot.`,
      );
    }

    const actual = sniffBase64(data);

    if (!actual || actual !== mediaType) {
      return refuse(
        "unsupported_image",
        "Attach PNG, JPEG, WebP, or GIF images.",
      );
    }

    images.push({
      mediaType: actual,
      data,
      ...(typeof name === "string" &&
        name.trim() && { name: cleanFileName(name) }),
    });
  }

  return { ok: true, images };
};

const UNSUPPORTED_FILE =
  "Attach PDF, plain text, Markdown, or CSV files, or PNG, JPEG, WebP, or GIF images.";

export const UNREADABLE_FILE = "That file isn't a readable PDF or text file.";

const isDocumentType = (type: unknown): type is DocumentType =>
  typeof type === "string" &&
  (DOCUMENT_TYPES as readonly string[]).includes(type);

/**
 * Whether bytes are text a person wrote: valid UTF-8 with no NUL and almost no
 * other control characters, so a binary file renamed `.txt` is refused
 */
export const isReadableText = (bytes: Uint8Array): boolean => {
  let text: string;

  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return false;
  }

  if (text.includes("\u0000")) return false;

  let control = 0;

  for (const char of text) {
    const code = char.charCodeAt(0);

    // Tab, newline, form feed, and carriage return are ordinary in text
    if (
      (code < 0x20 && ![0x09, 0x0a, 0x0c, 0x0d].includes(code)) ||
      code === 0x7f
    ) {
      control++;
    }
  }

  return control <= Math.max(2, text.length / 1000);
};

/**
 * Validate a request's attached files: together with `imageCount` images at
 * most `maxAttachments`; each a PDF (checked by its `%PDF-` header) of at most
 * `maxPdfBytes`, or a plain text, Markdown, or CSV file (checked to be real
 * text) of at most `maxTextFileBytes`. Absent means none
 * @param input - The request's files, untrusted.
 * @param imageCount - How many images the same message carries.
 * @param limits - Limits to apply instead of the shared defaults.
 */
export const parseDocuments = (
  input: unknown,
  imageCount = 0,
  limits: Partial<AttachmentLimits> = {},
): DocumentsParse => {
  const { maxAttachments, maxPdfBytes, maxTextFileBytes } = {
    ...DEFAULT_ATTACHMENT_LIMITS,
    ...limits,
  };

  if (input === undefined || input === null) {
    return { ok: true, documents: [] };
  }

  if (!Array.isArray(input)) {
    return refuse("invalid_files", UNREADABLE_FILE);
  }

  if (input.length + imageCount > maxAttachments) {
    return refuse(
      "too_many_files",
      `Attach up to ${maxAttachments} files to one message.`,
    );
  }

  const documents: AttachedDocument[] = [];

  for (const item of input) {
    const { mediaType, name, data } = (item ?? {}) as {
      mediaType?: unknown;
      name?: unknown;
      data?: unknown;
    };

    if (typeof data !== "string" || !data || !BASE64.test(data)) {
      return refuse("invalid_files", UNREADABLE_FILE);
    }

    if (!isDocumentType(mediaType)) {
      return refuse("unsupported_file", UNSUPPORTED_FILE);
    }

    const isPdf = mediaType === "application/pdf";

    if (decodedLength(data) > (isPdf ? maxPdfBytes : maxTextFileBytes)) {
      return refuse(
        "file_too_large",
        isPdf
          ? `Each PDF can be up to ${size(maxPdfBytes)}.`
          : `Each text, Markdown, or CSV file can be up to ${size(maxTextFileBytes)}.`,
      );
    }

    const bytes = new Uint8Array(Buffer.from(data, "base64"));
    const readable = isPdf
      ? String.fromCharCode(...bytes.subarray(0, 5)) === "%PDF-"
      : isReadableText(bytes);

    if (!readable) {
      return refuse("unsupported_file", UNREADABLE_FILE);
    }

    documents.push({ mediaType, name: cleanFileName(name), data });
  }

  return { ok: true, documents };
};

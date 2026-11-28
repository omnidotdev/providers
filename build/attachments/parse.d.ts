import type { AttachedDocument, AttachedImage, AttachmentLimits, AttachmentRefusal, ImageType } from "./types";
export type ImagesParse = {
    ok: true;
    images: AttachedImage[];
} | AttachmentRefusal;
export type DocumentsParse = {
    ok: true;
    documents: AttachedDocument[];
} | AttachmentRefusal;
/** Decoded byte length of base64 text */
export declare const decodedLength: (data: string) => number;
/**
 * The image type its first bytes show, whatever the request claims, so a
 * mislabeled or non-image upload never reaches a model
 * @param bytes - The start of the file (12 bytes is enough).
 * @returns The image type, or null when it is not a PNG, JPEG, GIF, or WebP.
 */
export declare const sniffImageType: (bytes: Uint8Array) => ImageType | null;
/** A file name safe to show a model: no paths, control characters, or markup */
export declare const cleanFileName: (name: unknown) => string;
/**
 * Validate a request's attached images: at most `maxImages`, each a PNG,
 * JPEG, WebP, or GIF (checked by its bytes, not its label) of at most
 * `maxImageBytes`. Absent means none
 * @param input - The request's images, untrusted.
 * @param limits - Limits to apply instead of the shared defaults.
 */
export declare const parseImages: (input: unknown, limits?: Partial<AttachmentLimits>) => ImagesParse;
export declare const UNREADABLE_FILE = "That file isn't a readable PDF or text file.";
/**
 * Whether bytes are text a person wrote: valid UTF-8 with no NUL and almost no
 * other control characters, so a binary file renamed `.txt` is refused
 */
export declare const isReadableText: (bytes: Uint8Array) => boolean;
/**
 * Validate a request's attached files: together with `imageCount` images at
 * most `maxAttachments`; each a PDF (checked by its `%PDF-` header) of at most
 * `maxPdfBytes`, or a plain text, Markdown, or CSV file (checked to be real
 * text) of at most `maxTextFileBytes`. Absent means none
 * @param input - The request's files, untrusted.
 * @param imageCount - How many images the same message carries.
 * @param limits - Limits to apply instead of the shared defaults.
 */
export declare const parseDocuments: (input: unknown, imageCount?: number, limits?: Partial<AttachmentLimits>) => DocumentsParse;

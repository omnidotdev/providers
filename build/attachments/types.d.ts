/** Image types a model reads, checked by their bytes */
export declare const IMAGE_TYPES: readonly ["image/png", "image/jpeg", "image/webp", "image/gif"];
export type ImageType = (typeof IMAGE_TYPES)[number];
/**
 * Files read for their text: a PDF, or plain text, Markdown, or CSV. Each is
 * checked by its content, not its label
 */
export declare const DOCUMENT_TYPES: readonly ["application/pdf", "text/plain", "text/markdown", "text/csv"];
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
/** One attached image, as base64 without a `data:` prefix */
export interface AttachedImage {
    mediaType: ImageType;
    data: string;
    /** The attached file's name, cleaned, when the client sent one */
    name?: string;
}
/** One attached file to read for its text, as base64 without a `data:` prefix */
export interface AttachedDocument {
    mediaType: DocumentType;
    /** The file's name, cleaned, for the model to tell files apart */
    name: string;
    data: string;
}
/** An attached file's text, ready for the model */
export interface ReadDocument {
    name: string;
    /** What kind of file it was, for the model */
    kind: "PDF" | "text" | "Markdown" | "CSV";
    text: string;
    /** Whether the text was cut at the document character limit */
    truncated: boolean;
}
/**
 * How much one message may carry. Every Omni chat composer shares the
 * defaults ({@link DEFAULT_ATTACHMENT_LIMITS}); a product may lower them
 */
export interface AttachmentLimits {
    /** Most files of any kind (images and documents) one message may carry */
    maxAttachments: number;
    /** Most images one message may carry */
    maxImages: number;
    /** Largest image, decoded, in bytes */
    maxImageBytes: number;
    /** Largest PDF, decoded, in bytes */
    maxPdfBytes: number;
    /** Largest plain text, Markdown, or CSV file, decoded, in bytes */
    maxTextFileBytes: number;
    /** Most pages read from one PDF; a longer one is refused */
    maxPdfPages: number;
    /**
     * Most characters of one file's text the model is sent; a longer file is
     * cut there and marked truncated
     */
    maxDocumentChars: number;
}
export declare const DEFAULT_ATTACHMENT_LIMITS: AttachmentLimits;
/** A refusal: a stable code for the client and a plain message for people */
export interface AttachmentRefusal {
    ok: false;
    code: string;
    error: string;
}

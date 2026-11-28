/**
 * Server-side chat attachments, shared by every Omni chat product: content
 * sniffing, limits, PDF and text extraction, image metadata removal, and
 * See Less image screening (fail closed). The composer UI that sends them is
 * thornberry's `AttachmentComposer`
 */
export { attachedFileBlocks, readDocuments } from "./documents";
export { imageSize, stripImageMetadata } from "./metadata";
export {
  cleanFileName,
  decodedLength,
  isReadableText,
  parseDocuments,
  parseImages,
  sniffImageType,
} from "./parse";
export { MAX_PDF_PAGES, PdfTooLongError, readPdfText } from "./pdf";
export { prepareAttachments } from "./prepare";
export { checkImage, isSeeLessConfigured, screenImages } from "./screening";
export {
  DEFAULT_ATTACHMENT_LIMITS,
  DOCUMENT_TYPES,
  IMAGE_TYPES,
} from "./types";

export type { DocumentsRead, ReadDocumentsOptions } from "./documents";
export type { ImageSize } from "./metadata";
export type { DocumentsParse, ImagesParse } from "./parse";
export type { PdfText } from "./pdf";
export type {
  PrepareAttachmentsOptions,
  PreparedAttachments,
} from "./prepare";
export type {
  ImageScreeningResult,
  ImagesScreening,
  ScreenImagesOptions,
  SeeLessConfig,
} from "./screening";
export type {
  AttachedDocument,
  AttachedImage,
  AttachmentLimits,
  AttachmentRefusal,
  DocumentType,
  ImageType,
  ReadDocument,
} from "./types";

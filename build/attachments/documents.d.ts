import type { AttachedDocument, AttachmentLimits, AttachmentRefusal, ReadDocument } from "./types";
export type DocumentsRead = {
    ok: true;
    documents: ReadDocument[];
} | AttachmentRefusal;
export interface ReadDocumentsOptions {
    /** Reads a PDF's text; defaults to {@link readPdfText} (needs `unpdf`) */
    readPdf?: (bytes: Uint8Array) => Promise<{
        pages: number;
        text: string;
    }>;
    /** Limits to apply instead of the shared defaults */
    limits?: Partial<AttachmentLimits>;
    /** The product's name, for the refusal of a PDF with no text */
    productName?: string;
}
/**
 * Read each validated file's text: a PDF's text through `readPdf`, a text file
 * as it is. A PDF with no text (a scan) or one that can't be read is refused
 * with a plain reason, so nothing is sent or charged
 * @param documents - Files already checked by `parseDocuments`.
 * @param options - PDF reader, limits, and the product's name.
 */
export declare const readDocuments: (documents: AttachedDocument[], options?: ReadDocumentsOptions) => Promise<DocumentsRead>;
/**
 * Each read file as its own labeled `<attached_file>` block for a model's
 * prompt. A file's text can never close its block early. The product writes
 * the instruction that goes before the blocks (what the files are for, and
 * that their text is material, never instructions)
 * @param documents - Files read by {@link readDocuments}.
 */
export declare const attachedFileBlocks: (documents: ReadDocument[]) => string[];

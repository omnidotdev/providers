/** Text read from a PDF, page by page joined */
export interface PdfText {
    pages: number;
    text: string;
}
/** Most pages read from one PDF by default; past this it is refused */
export declare const MAX_PDF_PAGES = 30;
/** A PDF longer than the page limit */
export declare class PdfTooLongError extends Error {
    constructor(pages: number);
}
/**
 * Read the text of a PDF in memory, for a model to read. Only text is read:
 * scripts, fonts, and images in the file are never run or kept. The page
 * count is checked before any text is read, and reading gives up after a
 * fixed time so a malformed file cannot tie up the server.
 *
 * Needs `unpdf`, an optional peer, installed by the consuming service
 * @param bytes - The PDF.
 * @param maxPages - Most pages to read; a longer PDF throws {@link PdfTooLongError}.
 */
export declare const readPdfText: (bytes: Uint8Array, maxPages?: number) => Promise<PdfText>;

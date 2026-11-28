import { UNREADABLE_FILE } from "./parse";
import { PdfTooLongError, readPdfText } from "./pdf";
import { DEFAULT_ATTACHMENT_LIMITS } from "./types";

import type {
  AttachedDocument,
  AttachmentLimits,
  AttachmentRefusal,
  DocumentType,
  ReadDocument,
} from "./types";

export type DocumentsRead =
  | { ok: true; documents: ReadDocument[] }
  | AttachmentRefusal;

const KINDS: Record<DocumentType, ReadDocument["kind"]> = {
  "application/pdf": "PDF",
  "text/plain": "text",
  "text/markdown": "Markdown",
  "text/csv": "CSV",
};

export interface ReadDocumentsOptions {
  /** Reads a PDF's text; defaults to {@link readPdfText} (needs `unpdf`) */
  readPdf?: (bytes: Uint8Array) => Promise<{ pages: number; text: string }>;
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
export const readDocuments = async (
  documents: AttachedDocument[],
  options: ReadDocumentsOptions = {},
): Promise<DocumentsRead> => {
  const { maxDocumentChars, maxPdfPages } = {
    ...DEFAULT_ATTACHMENT_LIMITS,
    ...options.limits,
  };
  const readPdf =
    options.readPdf ?? ((bytes: Uint8Array) => readPdfText(bytes, maxPdfPages));
  const read: ReadDocument[] = [];

  for (const document of documents) {
    const bytes = Buffer.from(document.data, "base64");
    let text: string;

    if (document.mediaType === "application/pdf") {
      try {
        text = (await readPdf(new Uint8Array(bytes))).text;
      } catch (error) {
        return error instanceof PdfTooLongError
          ? {
              ok: false,
              code: "pdf_too_long",
              error: `Each PDF can be up to ${maxPdfPages} pages.`,
            }
          : { ok: false, code: "unreadable_file", error: UNREADABLE_FILE };
      }

      if (!text.trim()) {
        return {
          ok: false,
          code: "pdf_has_no_text",
          error: `That PDF has no text ${options.productName ? `${options.productName} can read` : "that can be read"} (it may be a scan). Attach a screenshot of it instead.`,
        };
      }
    } else {
      // Checked as UTF-8 by parseDocuments; the decoder drops a leading
      // byte-order mark
      text = new TextDecoder("utf-8").decode(bytes);
    }

    // Normalize line endings and trim runs of blank lines a PDF can produce
    const clean = text
      .replace(/\r\n?/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    read.push({
      name: document.name,
      kind: KINDS[document.mediaType],
      text: clean.slice(0, maxDocumentChars),
      truncated: clean.length > maxDocumentChars,
    });
  }

  return { ok: true, documents: read };
};

/**
 * Each read file as its own labeled `<attached_file>` block for a model's
 * prompt. A file's text can never close its block early. The product writes
 * the instruction that goes before the blocks (what the files are for, and
 * that their text is material, never instructions)
 * @param documents - Files read by {@link readDocuments}.
 */
export const attachedFileBlocks = (documents: ReadDocument[]): string[] =>
  documents.map(
    (document) =>
      `<attached_file name="${document.name.replaceAll('"', "")}" type="${document.kind}"${document.truncated ? ' truncated="true"' : ""}>\n${document.text.replaceAll("</attached_file>", "")}\n</attached_file>`,
  );

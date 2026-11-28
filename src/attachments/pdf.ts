/** Text read from a PDF, page by page joined */
export interface PdfText {
  pages: number;
  text: string;
}

/** Most pages read from one PDF by default; past this it is refused */
export const MAX_PDF_PAGES = 30;

/** How long reading one PDF may take before it is given up on */
const READ_TIMEOUT_MS = 15_000;

/** A PDF longer than the page limit */
export class PdfTooLongError extends Error {
  constructor(pages: number) {
    super(`pdf has ${pages} pages`);
    this.name = "PdfTooLongError";
  }
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
export const readPdfText = async (
  bytes: Uint8Array,
  maxPages = MAX_PDF_PAGES,
): Promise<PdfText> => {
  const read = async (): Promise<PdfText> => {
    const { extractText, getDocumentProxy } = await import("unpdf");
    // Text only: fonts are never turned into font faces (PDF.js 6, bundled
    // by unpdf, no longer evaluates font code at all)
    const pdf = await getDocumentProxy(bytes, { disableFontFace: true });

    try {
      if (pdf.numPages > maxPages) throw new PdfTooLongError(pdf.numPages);

      const { totalPages, text } = await extractText(pdf, { mergePages: true });

      return { pages: totalPages, text };
    } finally {
      await pdf.loadingTask.destroy();
    }
  };

  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      read(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("pdf read timed out")),
          READ_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

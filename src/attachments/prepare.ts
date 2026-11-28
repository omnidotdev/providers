import { readDocuments } from "./documents";
import { stripImageMetadata } from "./metadata";
import { parseDocuments, parseImages } from "./parse";
import { screenImages } from "./screening";

import type { ReadDocumentsOptions } from "./documents";
import type { SeeLessConfig } from "./screening";
import type { AttachedImage, AttachmentLimits, ReadDocument } from "./types";

export interface PrepareAttachmentsOptions {
  /** See Less URL and key, for screening images */
  seeLess: SeeLessConfig;
  /** Whether this is production (a missing See Less config then refuses images) */
  production: boolean;
  /** Limits to apply instead of the shared defaults */
  limits?: Partial<AttachmentLimits>;
  /** The product's name, for refusals that name it */
  productName?: string;
  /** Reads a PDF's text; defaults to the shared `unpdf` reader */
  readPdf?: ReadDocumentsOptions["readPdf"];
  /** Server-side trace context for a refusal log, never the content */
  context?: string;
}

export type PreparedAttachments =
  | {
      ok: true;
      /** Screened images, without their metadata */
      images: AttachedImage[];
      /** Each attached file's text */
      documents: ReadDocument[];
    }
  | { ok: false; status: number; code: string; error: string };

/**
 * The whole server-side attachment check, in the order every chat product
 * runs it: validate images and files by their bytes and the limits, screen
 * the images through See Less (fail closed), strip their metadata, and read
 * the files' text. Nothing a refused message carried goes any further
 * @param input - The message's `images` and `files`, untrusted.
 * @param options - See Less config, production flag, limits, and naming.
 */
export const prepareAttachments = async (
  input: { images?: unknown; files?: unknown },
  options: PrepareAttachmentsOptions,
): Promise<PreparedAttachments> => {
  const images = parseImages(input.images, options.limits);

  if (!images.ok) return { ...images, status: 400 };

  const files = parseDocuments(
    input.files,
    images.images.length,
    options.limits,
  );

  if (!files.ok) return { ...files, status: 400 };

  const screening = await screenImages(images.images, {
    config: options.seeLess,
    production: options.production,
    context: options.context,
  });

  if (!screening.ok) return screening;

  const documents = await readDocuments(files.documents, {
    limits: options.limits,
    productName: options.productName,
    readPdf: options.readPdf,
  });

  if (!documents.ok) return { ...documents, status: 422 };

  return {
    ok: true,
    images: images.images.map((image) => ({
      ...image,
      data: Buffer.from(
        stripImageMetadata(
          new Uint8Array(Buffer.from(image.data, "base64")),
          image.mediaType,
        ),
      ).toString("base64"),
    })),
    documents: documents.documents,
  };
};

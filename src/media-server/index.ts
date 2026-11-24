/**
 * Server-only media helpers. Kept apart from `./media` (which also runs in
 * the browser) because they depend on `sharp`, an optional peer
 */

/** Blur-up placeholder width in pixels: enough color for a smooth blur */
const LQIP_WIDTH = 16;

interface LqipOptions {
  /** Placeholder width in pixels (default 16) */
  width?: number;
  /** WebP quality, 1 to 100 (default 30) */
  quality?: number;
}

/**
 * Make a blur-up placeholder (LQIP) for an uploaded image: a tiny webp as an
 * inline data URI (a few hundred bytes), to store with the image and render
 * blurred until it loads (thornberry `Image`'s `lqip`). Best-effort: returns
 * null when `sharp` is not installed or the bytes are not a readable image, so
 * an upload never fails over its placeholder
 * @param input - The uploaded image bytes
 * @param options - Placeholder size and quality
 */
const generateLqip = async (
  input: Buffer | Uint8Array,
  { width = LQIP_WIDTH, quality = 30 }: LqipOptions = {},
): Promise<string | null> => {
  try {
    const { default: sharp } = await import("sharp");
    const buffer = await sharp(input)
      // Respect EXIF orientation so the placeholder matches the shown image
      .rotate()
      .resize(width)
      .webp({ quality })
      .toBuffer();

    return `data:image/webp;base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.warn(
      "generateLqip: no placeholder made:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
};

export type { LqipOptions };
export { generateLqip };

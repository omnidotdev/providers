/**
 * Server-only media helpers. Kept apart from `./media` (which also runs in
 * the browser) because they depend on `sharp`, an optional peer
 */
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
declare const generateLqip: (input: Buffer | Uint8Array, { width, quality }?: LqipOptions) => Promise<string | null>;
export type { LqipOptions };
export { generateLqip };

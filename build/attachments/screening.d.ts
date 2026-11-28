import type { AttachedImage } from "./types";
type ImageVerdict = "allow" | "block" | "review";
export interface ImageScreeningResult {
    /** True only for an explicit `allow`; everything else (incl. outages) refuses */
    approved: boolean;
    /** "unavailable" when See Less could not be asked or understood */
    verdict: ImageVerdict | "unavailable";
    categories: string[];
    /** See Less's traceability handle for a non-allow verdict, when given */
    caseId?: string;
}
export interface SeeLessConfig {
    /** See Less base URL */
    url: string | undefined;
    /** The product's See Less client key (`x-api-key`) */
    apiKey: string | undefined;
    /** Injectable fetch (tests) */
    fetchImpl?: typeof fetch;
}
/** Whether See Less is configured */
export declare const isSeeLessConfigured: (config: SeeLessConfig) => boolean;
/**
 * Screen one image through See Less. Only an explicit `allow` approves; a
 * `block`, a `review`, an outage, or missing config all refuse
 * @param bytes - The image.
 * @param mimeType - Its type, already checked by its bytes.
 * @param config - See Less URL and key.
 */
export declare const checkImage: (bytes: Uint8Array, mimeType: string, config: SeeLessConfig) => Promise<ImageScreeningResult>;
export type ImagesScreening = {
    ok: true;
} | {
    ok: false;
    status: number;
    code: string;
    error: string;
};
export interface ScreenImagesOptions {
    /** See Less URL and key */
    config: SeeLessConfig;
    /**
     * Whether this is production. In production a missing config refuses every
     * image (fail closed); in development, with no See Less to call, images
     * pass unscreened
     */
    production: boolean;
    /** Server-side trace context, never the image */
    context?: string;
}
/**
 * Screen a message's attached images before any of them reaches a model, is
 * kept, or anything is charged. There is no later point to review one, so a
 * `review` verdict refuses the message just like a `block`. The refusal is
 * one plain message that never says which check failed, so the filter
 * cannot be probed
 * @param images - Images already checked by `parseImages`.
 * @param options - See Less config, production flag, and trace context.
 */
export declare const screenImages: (images: AttachedImage[], options: ScreenImagesOptions) => Promise<ImagesScreening>;
export {};

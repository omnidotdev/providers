import type { AttachedImage } from "./types";

/**
 * Image screening through See Less, shared by every Omni product that takes
 * attached images (the Gatekeeper avatar gate and crystal-api screen the same
 * way). FAILS CLOSED: only an explicit `allow` approves
 */

/** Shape of a single-image response from See Less */
interface SeeLessResponse {
  verdict?: string;
  categories?: Array<{ category?: string; score?: number }>;
  case_id?: string;
}

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

/**
 * Generous per-attempt timeout: See Less carries a CLIP model and can cold-start
 * after an idle window, so a short timeout would fail closed on a good image
 * rather than wait out the start
 */
const ATTEMPT_TIMEOUT_MS = 20_000;
/** One retry, for a pod that was terminating when first knocked */
const ATTEMPTS = 2;

const VERDICTS = new Set<string>(["allow", "block", "review"]);

const UNAVAILABLE: ImageScreeningResult = {
  approved: false,
  verdict: "unavailable",
  categories: [],
};

/** Whether See Less is configured */
export const isSeeLessConfigured = (config: SeeLessConfig): boolean =>
  Boolean(config.url && config.apiKey);

/**
 * Screen one image through See Less. Only an explicit `allow` approves; a
 * `block`, a `review`, an outage, or missing config all refuse
 * @param bytes - The image.
 * @param mimeType - Its type, already checked by its bytes.
 * @param config - See Less URL and key.
 */
export const checkImage = async (
  bytes: Uint8Array,
  mimeType: string,
  config: SeeLessConfig,
): Promise<ImageScreeningResult> => {
  if (!isSeeLessConfigured(config)) return UNAVAILABLE;

  const endpoint = `${config.url?.replace(/\/+$/, "")}/v1/moderate/image`;
  const doFetch = config.fetchImpl ?? fetch;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const body = new FormData();
    // See Less reads the multipart field named `file`
    body.append("file", new Blob([bytes as BlobPart], { type: mimeType }));

    try {
      const res = await doFetch(endpoint, {
        method: "POST",
        // No Content-Type: fetch sets the multipart boundary itself
        headers: { "x-api-key": config.apiKey ?? "" },
        body,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });

      // A 5xx is the shape a cold start or terminating pod takes: worth one
      // more knock. A 4xx is a bad key or payload and answers identically again
      if (res.status >= 500 && attempt < ATTEMPTS) continue;
      if (!res.ok) {
        console.error(`[imageModeration] See Less API error: ${res.status}`);
        return UNAVAILABLE;
      }

      const parsed = (await res.json()) as SeeLessResponse;
      const verdict = parsed.verdict ?? "";
      if (!VERDICTS.has(verdict)) {
        console.error(
          `[imageModeration] unrecognised See Less verdict: ${verdict}`,
        );
        return UNAVAILABLE;
      }

      const categories = (parsed.categories ?? [])
        .map((entry) => entry.category)
        .filter((category): category is string => Boolean(category));

      return {
        approved: verdict === "allow",
        verdict: verdict as ImageVerdict,
        categories,
        caseId: parsed.case_id,
      };
    } catch (err) {
      if (attempt < ATTEMPTS) continue;
      console.error("[imageModeration] See Less unreachable:", err);
      return UNAVAILABLE;
    }
  }

  return UNAVAILABLE;
};

export type ImagesScreening =
  | { ok: true }
  | { ok: false; status: number; code: string; error: string };

const REFUSED = {
  ok: false,
  status: 422,
  code: "image_refused",
  error:
    "One of the attached images can't be used. Remove it and try again. Nothing was charged.",
} as const;

const UNAVAILABLE_REFUSAL = {
  ok: false,
  status: 503,
  code: "image_check_unavailable",
  error:
    "Attached images can't be checked right now. Try again in a moment, or send without them. Nothing was charged.",
} as const;

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
export const screenImages = async (
  images: AttachedImage[],
  options: ScreenImagesOptions,
): Promise<ImagesScreening> => {
  if (!images.length) return { ok: true };

  const { config, production } = options;

  if (!isSeeLessConfigured(config)) {
    if (!production) return { ok: true };

    console.error(
      "[imageModeration] SEE_LESS_URL/SEE_LESS_API_KEY not set in production; refusing attached images",
    );

    return UNAVAILABLE_REFUSAL;
  }

  const results = await Promise.all(
    images.map((image) =>
      checkImage(
        new Uint8Array(Buffer.from(image.data, "base64")),
        image.mediaType,
        config,
      ),
    ),
  );

  const refused = results.find((result) => !result.approved);

  if (!refused) return { ok: true };

  // Server-side trace only (verdict, categories, case id), never the image
  console.warn(
    `[imageModeration] attached image refused${options.context ? `: ${options.context}` : ""} verdict=${refused.verdict}` +
      (refused.categories.length
        ? ` categories=${refused.categories.join(",")}`
        : "") +
      (refused.caseId ? ` caseId=${refused.caseId}` : ""),
  );

  return refused.verdict === "unavailable" ? UNAVAILABLE_REFUSAL : REFUSED;
};

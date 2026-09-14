import type { EventInput, SchemaRegistration } from "./interface";

/**
 * Cross-product application submission contract.
 *
 * Products submit applications into the Bifrost review queue by emitting a
 * `<product>.application.submitted` CloudEvent that Bifrost ingests at
 * `POST /webhooks/vortex`. This module owns the producer side of that contract
 * so every product emits the one shape Bifrost ingests, rather than each
 * hand-writing the event type and envelope.
 *
 * @see https://cloudevents.io
 */

/** Suffix Bifrost matches to route an application submission to its ingest. */
const SUBMITTED_TYPE_SUFFIX = ".application.submitted";

/**
 * A product's submission input. Identity fields (`product`, `applicationId`,
 * `userId`) are required; `handle` is best-effort and normalized to a non-empty
 * value by {@link submitApplication}, since Bifrost drops blank-handle
 * submissions as missing identity.
 */
export interface ApplicationSubmission {
  /** Source product (e.g. "arbor"); becomes the event type prefix */
  product: string;
  /** The producer's own application row id (idempotency key with product) */
  applicationId: string;
  /** Gatekeeper user id of the applicant */
  userId: string;
  /** The applicant's handle; falls back to email local-part then userId */
  handle?: string | null;
  /** The applicant's email, if known */
  email?: string | null;
  /** The product's own form fields */
  answers?: Record<string, unknown> | null;
  /** Beta-terms / NDA acceptance */
  nda?: {
    accepted?: boolean | null;
    version?: string | null;
    acceptedAt?: string | Date | null;
  } | null;
}

/**
 * The normalized `data` payload of a `<product>.application.submitted` event, as
 * emitted by {@link submitApplication}. Bifrost's ingest parses the wire form as
 * `Partial<ApplicationSubmittedData>` (untrusted input) and validates it.
 */
export interface ApplicationSubmittedData {
  product: string;
  applicationId: string;
  userId: string;
  handle: string;
  email: string | null;
  answers: Record<string, unknown>;
  nda: {
    accepted?: boolean | null;
    version?: string | null;
    acceptedAt?: string | Date | null;
  } | null;
}

/** Minimal emitter seam: the provider's `emit`, or an injected test double. */
export type ApplicationEmitter = (event: EventInput) => Promise<unknown>;

/**
 * Resolve a non-empty handle. Bifrost drops any submission with a blank handle
 * (logged as missing identity, still 200, so the drop is invisible to the
 * producer), so guarantee one: the given handle, else the email local-part,
 * else the user id.
 */
const resolveHandle = (
  handle: string | null | undefined,
  email: string | null | undefined,
  userId: string,
): string => handle?.trim() || email?.split("@")[0]?.trim() || userId;

/**
 * Emit a `<product>.application.submitted` event in the shape Bifrost ingests.
 *
 * Derives the event type from `product`, guarantees a non-empty handle, and
 * normalizes the `data` envelope, so a product adds an application with one
 * typed call instead of hand-writing the CloudEvent. Returns the emit promise so
 * the caller keeps fire-and-forget control (attach `.catch`); the underlying
 * provider no-ops when Vortex is unconfigured.
 *
 * A missing required identity field (`product`/`applicationId`/`userId`) rejects
 * the returned promise rather than throwing synchronously, so a caller's
 * fire-and-forget `.catch` catches every failure and an emit can never break the
 * mutation it runs in. These come from a just-written row, so a blank one is a
 * programmer error, surfaced rather than dropped silently at ingest.
 */
export const submitApplication = (
  emit: ApplicationEmitter,
  submission: ApplicationSubmission,
): Promise<unknown> => {
  const product = submission.product?.trim();
  const applicationId = submission.applicationId?.trim();
  const userId = submission.userId?.trim();

  if (!product) {
    return Promise.reject(new Error("submitApplication: product is required"));
  }
  if (!applicationId) {
    return Promise.reject(
      new Error("submitApplication: applicationId is required"),
    );
  }
  if (!userId) {
    return Promise.reject(new Error("submitApplication: userId is required"));
  }

  const email = submission.email ?? null;

  return emit({
    type: `${product}${SUBMITTED_TYPE_SUFFIX}`,
    subject: applicationId,
    // fresh literal (validated against the contract) is assignable to the
    // provider's Record<string, unknown> data seam, which an interface is not
    data: {
      product,
      applicationId,
      userId,
      handle: resolveHandle(submission.handle, email, userId),
      email,
      answers: submission.answers ?? {},
      nda: submission.nda ?? null,
    } satisfies ApplicationSubmittedData,
  });
};

/**
 * JSON Schema for the `data` of a `<product>.application.submitted` event.
 * Mirrors the identity Bifrost requires: `handle` is `minLength: 1` because a
 * blank handle is dropped at ingest.
 */
export const applicationSubmittedSchema: Record<string, unknown> = {
  type: "object",
  required: ["product", "applicationId", "userId", "handle"],
  properties: {
    product: { type: "string", minLength: 1 },
    applicationId: { type: "string", minLength: 1 },
    userId: { type: "string", minLength: 1 },
    handle: { type: "string", minLength: 1 },
    email: { type: ["string", "null"] },
    answers: { type: "object" },
    nda: {
      type: ["object", "null"],
      properties: {
        accepted: { type: ["boolean", "null"] },
        version: { type: ["string", "null"] },
        acceptedAt: { type: ["string", "null"] },
      },
    },
  },
};

/**
 * Build the schema registration for a product's `application.submitted` event,
 * so every product registers the same validated `payloadSchema` rather than a
 * bare name/description with no validation.
 *
 * Defaults to `enforcement: "warn"` (Vortex logs a mismatch but still delivers,
 * so promoting the fleet onto the schema cannot drop live events); promote to
 * `"strict"` once every producer is on the shared helper.
 */
export const applicationSubmittedSchemaRegistration = (
  product: string,
  source: string,
  enforcement: SchemaRegistration["enforcement"] = "warn",
): SchemaRegistration => ({
  name: `${product}${SUBMITTED_TYPE_SUFFIX}`,
  source,
  version: 1,
  description: `A user submitted a ${product} application; Bifrost ingests it for cross-product staff review`,
  payloadSchema: applicationSubmittedSchema,
  enforcement,
});

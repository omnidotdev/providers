import type { EventInput, SchemaRegistration } from "./interface";
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
export declare const submitApplication: (emit: ApplicationEmitter, submission: ApplicationSubmission) => Promise<unknown>;
/**
 * JSON Schema for the `data` of a `<product>.application.submitted` event.
 * Mirrors the identity Bifrost requires: `handle` is `minLength: 1` because a
 * blank handle is dropped at ingest.
 */
export declare const applicationSubmittedSchema: Record<string, unknown>;
/**
 * Build the schema registration for a product's `application.submitted` event,
 * so every product registers the same validated `payloadSchema` rather than a
 * bare name/description with no validation.
 *
 * Defaults to `enforcement: "warn"` (Vortex logs a mismatch but still delivers,
 * so promoting the fleet onto the schema cannot drop live events); promote to
 * `"strict"` once every producer is on the shared helper.
 */
export declare const applicationSubmittedSchemaRegistration: (product: string, source: string, enforcement?: SchemaRegistration["enforcement"]) => SchemaRegistration;

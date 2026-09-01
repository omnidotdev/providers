/**
 * Hardened request handler for S3-compatible clients.
 *
 * The default @aws-sdk/client-s3 request handler pools keep-alive sockets and
 * sets no request timeout that actually aborts. Against Garage at s3.omni.dev,
 * reached through a NAT/edge that silently idle-drops long-lived TCP
 * connections without a RST, the pool fills with zombie ESTABLISHED sockets;
 * the SDK keeps reusing them and every reuse blocks until the Fractal gateway
 * gives up (~30s) and returns 503. This hardened handler is the central fix
 * for every S3-backed consumer of this library.
 *
 * Two things fix it, and both are load-bearing on Bun (the runtime here) and
 * safe on Node:
 *   1. keepAlive false: never reuse a socket, so a dropped connection can never
 *      become a zombie the next request blocks on
 *   2. throwOnRequestTimeout true alongside requestTimeout: a plain
 *      requestTimeout on @smithy/node-http-handler v4 only logs a warning and
 *      lets the request keep hanging; the flag turns the timeout into a thrown
 *      error so the SDK can retry instead of hanging (verified on Bun 1.4)
 */
import type { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import type { NodeHttpHandler } from "@smithy/node-http-handler";
/**
 * Fail a stalled connect attempt fast. A healthy connect to Garage completes
 * in a few milliseconds, so anything beyond this is a dead path, not a slow one
 */
export declare const S3_CONNECTION_TIMEOUT_MS = 3000;
/**
 * Abort a request whose socket stops responding. Kept below the Fractal gateway
 * upstream timeout so a stuck request errors here (and the SDK retries) instead
 * of the gateway 503ing the browser first. Only fires as an error because the
 * handler sets throwOnRequestTimeout
 */
export declare const S3_REQUEST_TIMEOUT_MS = 10000;
/**
 * Build a NodeHttpHandler hardened against the stale keep-alive socket hang.
 *
 * Both @smithy/node-http-handler and the node agents are imported lazily so the
 * storage module never eager-loads them for consumers that do not use S3 (they
 * are optional peer dependencies, matching @aws-sdk/client-s3)
 */
declare const buildResilientRequestHandler: () => Promise<NodeHttpHandler>;
/**
 * Build an S3 client hardened against the stale keep-alive socket hang.
 *
 * Prefer this over `new S3Client(...)` for every S3-backed feature so a dropped
 * connection can never hang the request path. Async because both the SDK and
 * the request handler are imported lazily to keep them off the module load path
 *
 * @param config - Standard S3 client config (region, endpoint, credentials)
 * @returns A configured, hardened S3 client
 */
declare const createResilientS3Client: (config: S3ClientConfig) => Promise<S3Client>;
export { buildResilientRequestHandler, createResilientS3Client };

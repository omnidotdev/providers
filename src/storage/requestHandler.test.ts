import { describe, expect, it } from "bun:test";

import {
  S3_CONNECTION_TIMEOUT_MS,
  S3_REQUEST_TIMEOUT_MS,
  createResilientS3Client,
} from "./requestHandler";

describe("createResilientS3Client", () => {
  it("builds a client whose request handler hardens against the stale socket hang", async () => {
    const client = await createResilientS3Client({
      region: "us-east-1",
      endpoint: "https://s3.omni.dev",
      credentials: { accessKeyId: "test", secretAccessKey: "test" },
    });

    // The resolved config is exposed via the handler's configProvider promise
    // biome-ignore lint/suspicious/noExplicitAny: configProvider is internal to the smithy handler
    const handler = client.config.requestHandler as any;
    const resolved = await handler.configProvider;

    expect(resolved.connectionTimeout).toBe(S3_CONNECTION_TIMEOUT_MS);
    expect(resolved.requestTimeout).toBe(S3_REQUEST_TIMEOUT_MS);
    // The load-bearing flag: without it a request timeout only warns and hangs
    expect(resolved.throwOnRequestTimeout).toBe(true);
    // keepAlive false is the core of the fix, never reuse a socket
    expect(resolved.httpAgent.keepAlive).toBe(false);
    expect(resolved.httpsAgent.keepAlive).toBe(false);
  });
});

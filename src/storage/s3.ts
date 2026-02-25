import { CircuitBreaker } from "../util/circuitBreaker";
import { log } from "../util/log";

import type {
  PresignedParams,
  PresignedResult,
  StorageProvider,
  UploadParams,
  UploadResult,
} from "./interface";

/** Default presigned URL expiry in seconds (1 hour) */
const DEFAULT_PRESIGNED_EXPIRY = 3600;

type S3StorageProviderConfig = {
  /** S3 bucket name */
  bucket?: string;
  /** Custom S3-compatible endpoint (Railway Buckets, MinIO, etc.) */
  endpoint?: string;
  /** AWS region */
  region?: string;
  /** Explicit credentials (falls back to SDK default chain) */
  credentials?: { accessKeyId: string; secretAccessKey: string };
  /** Force path-style URLs (auto-detected for localhost endpoints) */
  forcePathStyle?: boolean;
  /** Override base URL for public object URLs */
  publicBaseUrl?: string;
  /** Circuit breaker failure threshold */
  circuitBreakerThreshold?: number;
  /** Circuit breaker cooldown in milliseconds */
  circuitBreakerCooldownMs?: number;
};

type ValidatedS3Config = S3StorageProviderConfig & {
  bucket: string;
};

/**
 * S3 storage provider.
 * Manages object storage via any S3-compatible backend.
 */
class S3StorageProvider implements StorageProvider {
  private readonly config: ValidatedS3Config;
  private readonly circuitBreaker: CircuitBreaker;
  // biome-ignore lint/suspicious/noExplicitAny: SDK types are dynamic
  private client: any = null;

  constructor(config: ValidatedS3Config) {
    this.config = config;
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "s3-storage",
    });
  }

  async upload(params: UploadParams): Promise<UploadResult> {
    const client = await this.#requireClient();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");

    await this.circuitBreaker.execute(async () => {
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
        CacheControl: params.cacheControl,
        Metadata: params.metadata,
      });

      await client.send(command);
    });

    const url = this.getPublicUrl(params.key);

    log("info", "storage", "object uploaded", {
      bucket: this.config.bucket,
      key: params.key,
    });

    return { key: params.key, url };
  }

  async delete(key: string): Promise<void> {
    const client = await this.#requireClient();
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

    await this.circuitBreaker.execute(async () => {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      await client.send(command);
    });

    log("info", "storage", "object deleted", {
      bucket: this.config.bucket,
      key,
    });
  }

  async getPresignedUploadUrl(
    params: PresignedParams,
  ): Promise<PresignedResult> {
    const client = await this.#requireClient();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const expiresIn = params.expiresIn ?? DEFAULT_PRESIGNED_EXPIRY;

    const url = await this.circuitBreaker.execute(async () => {
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: params.key,
        ContentType: params.contentType,
      });

      return getSignedUrl(client, command, { expiresIn });
    });

    log("info", "storage", "presigned URL generated", {
      bucket: this.config.bucket,
      key: params.key,
      expiresIn,
    });

    return { url, key: params.key, expiresIn };
  }

  getPublicUrl(key: string): string {
    if (this.config.publicBaseUrl) {
      const base = this.config.publicBaseUrl.replace(/\/+$/, "");
      return `${base}/${key}`;
    }

    // Custom endpoints use path-style URLs (MinIO, Railway Buckets, etc.)
    if (this.config.endpoint) {
      const base = this.config.endpoint.replace(/\/+$/, "");
      return `${base}/${this.config.bucket}/${key}`;
    }

    const region = this.config.region ?? "us-east-1";

    return `https://${this.config.bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      const client = await this.#requireClient();
      const { HeadBucketCommand } = await import("@aws-sdk/client-s3");

      await client.send(new HeadBucketCommand({ Bucket: this.config.bucket }));

      return { healthy: true, message: "OK" };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async close(): Promise<void> {
    this.client?.destroy();
    this.client = null;
    log("info", "storage", "S3 client closed");
  }

  async #requireClient() {
    if (this.client) return this.client;

    const { S3Client } = await import("@aws-sdk/client-s3");

    const forcePathStyle =
      this.config.forcePathStyle ??
      (this.config.endpoint
        ? /localhost|127\.0\.0\.1/.test(this.config.endpoint)
        : false);

    this.client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region ?? "us-east-1",
      credentials: this.config.credentials,
      forcePathStyle,
    });

    log("info", "storage", "S3 client initialized", {
      bucket: this.config.bucket,
      endpoint: this.config.endpoint,
      region: this.config.region,
      forcePathStyle,
    });

    return this.client;
  }
}

export { S3StorageProvider };

export type { S3StorageProviderConfig };

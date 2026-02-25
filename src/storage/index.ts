import { NoopStorageProvider } from "./noop";
import { S3StorageProvider } from "./s3";

import type { StorageProvider } from "./interface";
import type { NoopStorageProviderConfig } from "./noop";
import type { S3StorageProviderConfig } from "./s3";

/**
 * Discriminated union config for `createStorageProvider`.
 * Defaults to noop when `provider` is omitted.
 */
type StorageProviderConfig =
  | ({ provider: "s3" } & S3StorageProviderConfig)
  | ({ provider: "noop" } & NoopStorageProviderConfig)
  | NoopStorageProviderConfig;

/**
 * Create a storage provider.
 * @param config - Provider configuration (discriminated by `provider` field)
 * @returns Configured storage provider instance
 * @throws When required config is missing for the chosen variant
 */
const createStorageProvider = (
  config: StorageProviderConfig,
): StorageProvider => {
  if (!("provider" in config) || config.provider === "noop") {
    return new NoopStorageProvider();
  }

  if (config.provider === "s3") {
    if (!config.bucket) {
      throw new Error("S3StorageProvider requires bucket in config");
    }

    return new S3StorageProvider({ ...config, bucket: config.bucket });
  }

  // Exhaustive check
  const _exhaustive: never = config;
  throw new Error(`Unknown storage provider: ${_exhaustive}`);
};

export { createStorageProvider };

export { NoopStorageProvider } from "./noop";
export { S3StorageProvider } from "./s3";

export type { StorageProviderConfig };

export type {
  PresignedParams,
  PresignedResult,
  StorageProvider,
  UploadParams,
  UploadResult,
} from "./interface";
export type { NoopStorageProviderConfig } from "./noop";
export type { S3StorageProviderConfig } from "./s3";

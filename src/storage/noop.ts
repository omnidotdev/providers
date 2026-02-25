import type {
  PresignedParams,
  PresignedResult,
  StorageProvider,
  UploadParams,
  UploadResult,
} from "./interface";

type NoopStorageProviderConfig = Record<string, never>;

const NOOP_BASE_URL = "https://noop.example.com";

/**
 * No-op storage provider.
 * Returns mock results — useful for dev, testing, and SSR.
 */
class NoopStorageProvider implements StorageProvider {
  async upload(params: UploadParams): Promise<UploadResult> {
    return { key: params.key, url: `${NOOP_BASE_URL}/${params.key}` };
  }

  async delete(_key: string): Promise<void> {}

  async getPresignedUploadUrl(
    params: PresignedParams,
  ): Promise<PresignedResult> {
    return {
      url: `${NOOP_BASE_URL}/upload/${params.key}`,
      key: params.key,
      expiresIn: params.expiresIn ?? 3600,
    };
  }

  getPublicUrl(key: string): string {
    return `${NOOP_BASE_URL}/${key}`;
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    return { healthy: true, message: "noop" };
  }

  async close(): Promise<void> {}
}

export { NoopStorageProvider };

export type { NoopStorageProviderConfig };

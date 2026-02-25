import type { PresignedParams, PresignedResult, StorageProvider, UploadParams, UploadResult } from "./interface";
type NoopStorageProviderConfig = Record<string, never>;
/**
 * No-op storage provider.
 * Returns mock results — useful for dev, testing, and SSR.
 */
declare class NoopStorageProvider implements StorageProvider {
    upload(params: UploadParams): Promise<UploadResult>;
    delete(_key: string): Promise<void>;
    getPresignedUploadUrl(params: PresignedParams): Promise<PresignedResult>;
    getPublicUrl(key: string): string;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
}
export { NoopStorageProvider };
export type { NoopStorageProviderConfig };

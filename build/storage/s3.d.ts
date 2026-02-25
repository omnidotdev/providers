import type { PresignedParams, PresignedResult, StorageProvider, UploadParams, UploadResult } from "./interface";
type S3StorageProviderConfig = {
    /** S3 bucket name */
    bucket?: string;
    /** Custom S3-compatible endpoint (Railway Buckets, MinIO, etc.) */
    endpoint?: string;
    /** AWS region */
    region?: string;
    /** Explicit credentials (falls back to SDK default chain) */
    credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
    };
    /** Force path-style URLs (auto-detected for localhost endpoints) */
    forcePathStyle?: boolean;
    /** Override base URL for public object URLs */
    publicBaseUrl?: string;
};
type ValidatedS3Config = S3StorageProviderConfig & {
    bucket: string;
};
/**
 * S3 storage provider.
 * Manages object storage via any S3-compatible backend.
 */
declare class S3StorageProvider implements StorageProvider {
    #private;
    private readonly config;
    private client;
    constructor(config: ValidatedS3Config);
    upload(params: UploadParams): Promise<UploadResult>;
    delete(key: string): Promise<void>;
    getPresignedUploadUrl(params: PresignedParams): Promise<PresignedResult>;
    getPublicUrl(key: string): string;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
}
export { S3StorageProvider };
export type { S3StorageProviderConfig };

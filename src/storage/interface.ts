/** Parameters for uploading an object */
type UploadParams = {
  /** Storage key (path) for the object */
  key: string;
  /** Object body */
  body: Buffer | Uint8Array | ReadableStream | Blob | string;
  /** MIME content type */
  contentType?: string;
  /** Cache-Control header value */
  cacheControl?: string;
  /** Custom metadata key-value pairs */
  metadata?: Record<string, string>;
};

/** Result of a successful upload */
type UploadResult = {
  /** Storage key of the uploaded object */
  key: string;
  /** Public URL of the uploaded object */
  url: string;
};

/** Parameters for generating a presigned upload URL */
type PresignedParams = {
  /** Storage key (path) for the object */
  key: string;
  /** MIME content type */
  contentType?: string;
  /** URL expiry in seconds */
  expiresIn?: number;
};

/** Result of a presigned URL generation */
type PresignedResult = {
  /** Presigned upload URL */
  url: string;
  /** Storage key for the object */
  key: string;
  /** URL expiry in seconds */
  expiresIn: number;
};

/**
 * Storage provider interface.
 * Implementations manage object storage (uploads, deletions, presigned URLs).
 */
interface StorageProvider {
  /**
   * Upload an object to storage.
   * @param params - Upload parameters
   * @returns Upload result with key and URL
   */
  upload(params: UploadParams): Promise<UploadResult>;

  /**
   * Delete an object from storage.
   * @param key - Storage key of the object to delete
   */
  delete(key: string): Promise<void>;

  /**
   * Generate a presigned URL for direct client uploads.
   * @param params - Presigned URL parameters
   * @returns Presigned URL result
   */
  getPresignedUploadUrl(params: PresignedParams): Promise<PresignedResult>;

  /**
   * Get the public URL for an object.
   * @param key - Storage key of the object
   * @returns Public URL string
   */
  getPublicUrl(key: string): string;

  /** Health check for the provider */
  healthCheck?(): Promise<{ healthy: boolean; message?: string }>;

  /** Close the provider connection (if stateful) */
  close?(): Promise<void>;
}

export type {
  PresignedParams,
  PresignedResult,
  StorageProvider,
  UploadParams,
  UploadResult,
};

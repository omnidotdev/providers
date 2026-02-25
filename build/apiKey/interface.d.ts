/**
 * Verified API key information returned by the provider
 */
type ApiKeyInfo = {
    id: string;
    name: string;
    userId: string;
    organizationId: string;
    metadata?: Record<string, unknown>;
};
/**
 * API key verification provider interface.
 * Implementations verify API keys and return identity information.
 */
interface ApiKeyProvider {
    /**
     * Verify an API key and return associated identity info.
     * @param key - The raw API key string
     * @returns Key info if valid, null if invalid or on error (fail-safe)
     */
    verifyApiKey(key: string): Promise<ApiKeyInfo | null>;
    /** Health check for the provider */
    healthCheck?(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
}
export type { ApiKeyInfo, ApiKeyProvider };

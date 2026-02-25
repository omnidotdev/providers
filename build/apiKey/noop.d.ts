import type { ApiKeyInfo, ApiKeyProvider } from "./interface";
type NoopApiKeyProviderConfig = {
    /** Mock result to return for any key verification */
    mockResult?: ApiKeyInfo | null;
};
/**
 * No-op API key provider.
 * Returns a configurable mock result — useful for dev, testing, and SSR.
 */
declare class NoopApiKeyProvider implements ApiKeyProvider {
    private readonly mockResult;
    constructor(config?: NoopApiKeyProviderConfig);
    verifyApiKey(_key: string): Promise<ApiKeyInfo | null>;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
}
export { NoopApiKeyProvider };
export type { NoopApiKeyProviderConfig };

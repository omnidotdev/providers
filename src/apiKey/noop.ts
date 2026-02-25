import type { ApiKeyInfo, ApiKeyProvider } from "./interface";

type NoopApiKeyProviderConfig = {
  /** Mock result to return for any key verification */
  mockResult?: ApiKeyInfo | null;
};

/**
 * No-op API key provider.
 * Returns a configurable mock result — useful for dev, testing, and SSR.
 */
class NoopApiKeyProvider implements ApiKeyProvider {
  private readonly mockResult: ApiKeyInfo | null;

  constructor(config?: NoopApiKeyProviderConfig) {
    this.mockResult = config?.mockResult ?? null;
  }

  async verifyApiKey(_key: string): Promise<ApiKeyInfo | null> {
    return this.mockResult;
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    return { healthy: true, message: "noop" };
  }
}

export { NoopApiKeyProvider };

export type { NoopApiKeyProviderConfig };

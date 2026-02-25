/** Context passed to flag evaluation for targeting */
type FlagContext = {
  /** User ID for user-level targeting */
  userId?: string;
  /** Organization ID for org-level targeting */
  organizationId?: string;
  /** Environment name (e.g. "production", "staging") */
  environment?: string;
  /** Additional properties for custom targeting rules */
  properties?: Record<string, string>;
};

/**
 * Feature flags provider interface.
 * Implementations evaluate feature flags for progressive rollouts and targeting.
 */
interface FlagProvider {
  /**
   * Evaluate whether a flag is enabled.
   * @param flagKey - Flag identifier
   * @param context - Optional evaluation context for targeting
   * @returns Whether the flag is enabled
   */
  isEnabled(flagKey: string, context?: FlagContext): Promise<boolean>;

  /** Health check for the provider */
  healthCheck?(): Promise<{ healthy: boolean; message?: string }>;

  /** Close the provider connection (if stateful) */
  close?(): Promise<void>;
}

export type { FlagContext, FlagProvider };

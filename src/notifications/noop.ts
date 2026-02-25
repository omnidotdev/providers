import type {
  EmailParams,
  EmailResult,
  NotificationProvider,
} from "./interface";

type NoopNotificationProviderConfig = Record<string, never>;

/**
 * No-op notification provider.
 * Swallows notifications silently — useful for dev, testing, and SSR.
 */
class NoopNotificationProvider implements NotificationProvider {
  async sendEmail(_params: EmailParams): Promise<EmailResult> {
    return { success: true, messageId: crypto.randomUUID() };
  }

  async sendEmailBatch(params: EmailParams[]): Promise<EmailResult[]> {
    return params.map(() => ({
      success: true,
      messageId: crypto.randomUUID(),
    }));
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    return { healthy: true, message: "noop" };
  }

  async close(): Promise<void> {}
}

export { NoopNotificationProvider };

export type { NoopNotificationProviderConfig };

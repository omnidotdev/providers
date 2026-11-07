import type { EmailParams, EmailResult, NotificationProvider } from "./interface";
type NoopNotificationProviderConfig = Record<string, never>;
/**
 * No-op notification provider.
 * Swallows notifications silently — useful for dev, testing, and SSR.
 */
declare class NoopNotificationProvider implements NotificationProvider {
    sendEmail(_params: EmailParams): Promise<EmailResult>;
    sendEmailBatch(params: EmailParams[]): Promise<EmailResult[]>;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
}
export type { NoopNotificationProviderConfig };
export { NoopNotificationProvider };

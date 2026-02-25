import type { EmailParams, EmailResult, NotificationProvider } from "./interface";
type ResendNotificationProviderConfig = {
    /** Resend API key */
    apiKey?: string;
    /** Default sender email address */
    defaultFrom?: string;
    /** Circuit breaker failure threshold */
    circuitBreakerThreshold?: number;
    /** Circuit breaker cooldown in milliseconds */
    circuitBreakerCooldownMs?: number;
};
type ValidatedResendConfig = ResendNotificationProviderConfig & {
    apiKey: string;
    defaultFrom: string;
};
/**
 * Resend notification provider.
 * Sends transactional emails via the Resend API.
 *
 * Unlike events providers, send failures return `{ success: false }` instead of
 * throwing so a failed email never crashes a request handler.
 */
declare class ResendNotificationProvider implements NotificationProvider {
    #private;
    private readonly config;
    private readonly circuitBreaker;
    private client;
    constructor(config: ValidatedResendConfig);
    sendEmail(params: EmailParams): Promise<EmailResult>;
    sendEmailBatch(params: EmailParams[]): Promise<EmailResult[]>;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
}
export { ResendNotificationProvider };
export type { ResendNotificationProviderConfig };

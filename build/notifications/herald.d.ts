import type { EmailParams, EmailResult, NotificationProvider } from "./interface";
type HeraldNotificationProviderConfig = {
    /** Herald API key */
    apiKey?: string;
    /** Herald API base URL (no trailing slash) */
    apiUrl?: string;
    /** Default sender email address */
    defaultFrom?: string;
    /** Circuit breaker failure threshold */
    circuitBreakerThreshold?: number;
    /** Circuit breaker cooldown in milliseconds */
    circuitBreakerCooldownMs?: number;
};
type ValidatedHeraldConfig = HeraldNotificationProviderConfig & {
    apiKey: string;
    apiUrl: string;
    defaultFrom: string;
};
/**
 * Herald notification provider.
 * Sends transactional emails via the self-hosted Herald API.
 *
 * Unlike events providers, send failures return `{ success: false }` instead of
 * throwing so a failed email never crashes a request handler.
 */
declare class HeraldNotificationProvider implements NotificationProvider {
    #private;
    private readonly config;
    private readonly circuitBreaker;
    constructor(config: ValidatedHeraldConfig);
    sendEmail(params: EmailParams): Promise<EmailResult>;
    sendEmailBatch(params: EmailParams[]): Promise<EmailResult[]>;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
}
export { HeraldNotificationProvider };
export type { HeraldNotificationProviderConfig };

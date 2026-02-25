/** Parameters for sending an email */
type EmailParams = {
    /** Recipient email address(es) */
    to: string | string[];
    /** Email subject line */
    subject: string;
    /** Email body content */
    body: string;
    /** Sender email address */
    from?: string;
    /** Reply-to email address */
    replyTo?: string;
    /** CC recipients */
    cc?: string[];
    /** BCC recipients */
    bcc?: string[];
    /** Whether `body` contains HTML (default false, plain text) */
    html?: boolean;
};
/** Result of a send email operation */
type EmailResult = {
    /** Whether the email was sent successfully */
    success: boolean;
    /** Provider-assigned message ID */
    messageId?: string;
    /** Error message if sending failed */
    error?: string;
};
/**
 * Notification provider interface.
 * Implementations deliver notifications (email, push, etc.) to end users.
 */
interface NotificationProvider {
    /**
     * Send a single email.
     * @param params - Email parameters
     * @returns Result indicating success or failure
     */
    sendEmail(params: EmailParams): Promise<EmailResult>;
    /**
     * Send multiple emails in a batch.
     * Implementations may use provider-native batching when available.
     */
    sendEmailBatch?(params: EmailParams[]): Promise<EmailResult[]>;
    /** Health check for the provider */
    healthCheck?(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
}
export type { EmailParams, EmailResult, NotificationProvider };

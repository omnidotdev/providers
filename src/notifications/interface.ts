/**
 * A file attached to an email, in the common transactional email API shape.
 * The provider enforces its own limits (Herald: at most 20 files and 25 MiB
 * total decoded size per message, executable and script types refused).
 */
type EmailAttachment = {
  /** File name shown to the recipient, e.g. "contract.pdf" */
  filename: string;
  /** File content: raw bytes, or an already base64-encoded string */
  content: Uint8Array | string;
  /** MIME type, e.g. "application/pdf"; inferred from the filename when omitted */
  contentType?: string;
  /** Content-ID for an inline image, referenced from an html body as `cid:<contentId>` */
  contentId?: string;
};

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
  /** Additional headers (e.g. List-Unsubscribe); reserved headers cannot be overridden */
  headers?: Record<string, string>;
  /** Whether `body` contains HTML (default false, plain text) */
  html?: boolean;
  /** Files to attach; every recipient of a multi-recipient send receives them */
  attachments?: EmailAttachment[];
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
  healthCheck?(): Promise<{ healthy: boolean; message?: string }>;

  /** Close the provider connection (if stateful) */
  close?(): Promise<void>;
}

export type { EmailAttachment, EmailParams, EmailResult, NotificationProvider };

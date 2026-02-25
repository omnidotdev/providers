import { CircuitBreaker } from "../util/circuitBreaker";
import { log } from "../util/log";

import type {
  EmailParams,
  EmailResult,
  NotificationProvider,
} from "./interface";

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
class ResendNotificationProvider implements NotificationProvider {
  private readonly config: ValidatedResendConfig;
  private readonly circuitBreaker: CircuitBreaker;
  // biome-ignore lint/suspicious/noExplicitAny: SDK types are dynamic
  private client: any = null;

  constructor(config: ValidatedResendConfig) {
    this.config = config;
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "resend-notifications",
    });
  }

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    try {
      const client = await this.#requireClient();
      const to = Array.isArray(params.to) ? params.to : [params.to];

      const payload = {
        from: params.from ?? this.config.defaultFrom,
        to,
        subject: params.subject,
        ...(params.html ? { html: params.body } : { text: params.body }),
        ...(params.replyTo && { replyTo: params.replyTo }),
        ...(params.cc && { cc: params.cc }),
        ...(params.bcc && { bcc: params.bcc }),
      };

      const result = await this.circuitBreaker.execute(async () =>
        client.emails.send(payload),
      );

      log("info", "notifications", "email sent", {
        messageId: result.data?.id,
        to,
      });

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      log("error", "notifications", "email send failed", {
        error: message,
      });

      return { success: false, error: message };
    }
  }

  async sendEmailBatch(params: EmailParams[]): Promise<EmailResult[]> {
    try {
      const client = await this.#requireClient();

      const payloads = params.map((p) => {
        const to = Array.isArray(p.to) ? p.to : [p.to];

        return {
          from: p.from ?? this.config.defaultFrom,
          to,
          subject: p.subject,
          ...(p.html ? { html: p.body } : { text: p.body }),
          ...(p.replyTo && { replyTo: p.replyTo }),
          ...(p.cc && { cc: p.cc }),
          ...(p.bcc && { bcc: p.bcc }),
        };
      });

      const result = await this.circuitBreaker.execute(async () =>
        client.batch.send(payloads),
      );

      log("info", "notifications", "email batch sent", {
        count: params.length,
      });

      return (result.data ?? []).map(
        (item: { id?: string }) =>
          ({
            success: true,
            messageId: item.id,
          }) as EmailResult,
      );
    } catch (error) {
      // Batch API failure marks all emails as failed since partial results
      // are not available from the Resend SDK on transport errors
      const message = error instanceof Error ? error.message : "Unknown error";

      log("error", "notifications", "email batch send failed", {
        error: message,
      });

      return params.map(() => ({ success: false, error: message }));
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      await this.#requireClient();
      return { healthy: true, message: "OK" };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async close(): Promise<void> {
    this.client = null;
    log("info", "notifications", "Resend client closed");
  }

  async #requireClient() {
    if (this.client) return this.client;

    const { Resend } = await import("resend");

    this.client = new Resend(this.config.apiKey);

    log("info", "notifications", "Resend client initialized");

    return this.client;
  }
}

export { ResendNotificationProvider };

export type { ResendNotificationProviderConfig };

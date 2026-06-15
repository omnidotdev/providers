import { CircuitBreaker } from "../util/circuitBreaker";
import { log } from "../util/log";

import type {
  EmailParams,
  EmailResult,
  NotificationProvider,
} from "./interface";

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

/** Request body accepted by the Herald `POST /messages` endpoint. */
type HeraldMessageBody = {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Herald notification provider.
 * Sends transactional emails via the self-hosted Herald API.
 *
 * Unlike events providers, send failures return `{ success: false }` instead of
 * throwing so a failed email never crashes a request handler.
 */
class HeraldNotificationProvider implements NotificationProvider {
  private readonly config: ValidatedHeraldConfig;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(config: ValidatedHeraldConfig) {
    this.config = config;
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "herald-notifications",
    });
  }

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    try {
      // Herald accepts a single recipient per message, so fan out one request
      // per recipient and treat the send as successful only if all succeed
      const recipients = Array.isArray(params.to) ? params.to : [params.to];

      let lastMessageId: string | undefined;

      for (const recipient of recipients) {
        const body: HeraldMessageBody = {
          to: recipient,
          from: params.from ?? this.config.defaultFrom,
          subject: params.subject,
          // Herald requires a non-empty html part; for plain-text bodies we set
          // both html and text so the text part is preserved
          html: params.body,
          ...(params.html ? {} : { text: params.body }),
        };

        lastMessageId = await this.circuitBreaker.execute(async () =>
          this.#postMessage(body),
        );
      }

      log("info", "notifications", "email sent", {
        messageId: lastMessageId,
        to: recipients,
      });

      return { success: true, messageId: lastMessageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      log("error", "notifications", "email send failed", {
        error: message,
      });

      return { success: false, error: message };
    }
  }

  async sendEmailBatch(params: EmailParams[]): Promise<EmailResult[]> {
    // Herald has no native batch endpoint, so send each email individually
    return Promise.all(params.map((p) => this.sendEmail(p)));
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    return {
      healthy: !this.circuitBreaker.isOpen(),
      message: this.circuitBreaker.isOpen() ? "circuit open" : "OK",
    };
  }

  /**
   * POST a single message to Herald.
   * @returns The Herald-assigned message id
   * @throws When Herald responds with a non-2xx status
   */
  async #postMessage(body: HeraldMessageBody): Promise<string | undefined> {
    const response = await fetch(`${this.config.apiUrl}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response
        .json()
        .then((data: { error?: string }) => data.error)
        .catch(() => undefined);

      throw new Error(
        `Herald responded ${response.status}${detail ? `: ${detail}` : ""}`,
      );
    }

    const data = (await response.json()) as { id?: string };

    return data.id;
  }
}

export { HeraldNotificationProvider };

export type { HeraldNotificationProviderConfig };

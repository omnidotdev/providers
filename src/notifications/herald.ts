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
  /** Max retries on a transient failure (network or 5xx). Defaults to 2. */
  maxRetries?: number;
  /** Base delay for exponential backoff between retries, ms. Defaults to 200. */
  retryBaseDelayMs?: number;
};

/** HTTP error from Herald carrying the response status for retry decisions. */
class HeraldHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  headers?: Record<string, string>;
};

/**
 * Extract a bare email address from an RFC 5322 address. Herald validates
 * `to`/`from` as bare emails and rejects the `Name <email>` display form, so
 * strip any display name down to the address inside the angle brackets.
 */
const toBareEmail = (address: string): string => {
  const match = address.match(/<([^>]+)>/);
  return (match ? match[1] : address).trim();
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

      for (const [index, recipient] of recipients.entries()) {
        const body: HeraldMessageBody = {
          to: toBareEmail(recipient),
          from: toBareEmail(params.from ?? this.config.defaultFrom),
          subject: params.subject,
          // Herald requires a non-empty html part; for plain-text bodies we set
          // both html and text so the text part is preserved
          html: params.body,
          ...(params.html ? {} : { text: params.body }),
          ...(params.replyTo ? { replyTo: toBareEmail(params.replyTo) } : {}),
          ...(params.headers ? { headers: params.headers } : {}),
          // cc/bcc attach to the first message only, so a multi-recipient
          // fan-out does not send the same copy to each cc/bcc address
          ...(index === 0 && params.cc?.length
            ? { cc: params.cc.map(toBareEmail) }
            : {}),
          ...(index === 0 && params.bcc?.length
            ? { bcc: params.bcc.map(toBareEmail) }
            : {}),
        };

        lastMessageId = await this.circuitBreaker.execute(async () =>
          this.#postWithRetry(body),
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
   * POST a message, retrying transient failures with exponential backoff.
   *
   * Retries a network error or a 5xx (Herald briefly down / overloaded), but
   * never a 4xx: a 422 (suppressed recipient, unverified sending domain) or a
   * 400 (bad request) is permanent and retrying would only waste calls. The
   * circuit breaker wraps this, so a fully-exhausted retry counts as one
   * failure toward opening the circuit.
   */
  async #postWithRetry(body: HeraldMessageBody): Promise<string | undefined> {
    const maxRetries = this.config.maxRetries ?? DEFAULT_MAX_RETRIES;
    const baseDelay =
      this.config.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;

    for (let attempt = 0; ; attempt++) {
      try {
        return await this.#postMessage(body);
      } catch (error) {
        const status =
          error instanceof HeraldHttpError ? error.status : undefined;
        // transient = network error (no status) or any 5xx
        const transient = status === undefined || status >= 500;

        if (!transient || attempt >= maxRetries) throw error;

        await sleep(baseDelay * 2 ** attempt);
      }
    }
  }

  /**
   * POST a single message to Herald.
   * @returns The Herald-assigned message id
   * @throws {HeraldHttpError} When Herald responds with a non-2xx status
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

      throw new HeraldHttpError(
        `Herald responded ${response.status}${detail ? `: ${detail}` : ""}`,
        response.status,
      );
    }

    const data = (await response.json()) as { id?: string };

    return data.id;
  }
}

export { HeraldNotificationProvider };

export type { HeraldNotificationProviderConfig };

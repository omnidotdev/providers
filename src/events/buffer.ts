import { log } from "../util/log";

import type { EmitResult, EventInput } from "./interface";

type BufferConfig = {
  /** Max events before auto-flush (default 50) */
  maxSize: number;
  /** Flush interval in milliseconds (default 100) */
  flushIntervalMs: number;
};

type FlushFn = (events: EventInput[]) => Promise<EmitResult[]>;

/**
 * Local event buffer with flush-by-size and flush-by-time.
 *
 * Queues events locally and flushes when either the buffer
 * reaches `maxSize` or `flushIntervalMs` elapses.
 */
class EventBuffer {
  readonly #config: BufferConfig;
  readonly #flushFn: FlushFn;
  #queue: EventInput[] = [];
  #timer: ReturnType<typeof setInterval> | null = null;
  #closed = false;

  constructor(config: BufferConfig, flushFn: FlushFn) {
    this.#config = config;
    this.#flushFn = flushFn;
    this.#startTimer();
  }

  async add(event: EventInput): Promise<void> {
    if (this.#closed) {
      throw new Error("EventBuffer is closed");
    }

    this.#queue.push(event);

    if (this.#queue.length >= this.#config.maxSize) {
      await this.flush();
    }
  }

  async flush(): Promise<EmitResult[]> {
    if (this.#queue.length === 0) return [];

    const batch = this.#queue.splice(0);

    try {
      const results = await this.#flushFn(batch);

      log("info", "events", "buffer flushed", {
        count: batch.length,
      });

      return results;
    } catch (err) {
      log("error", "events", "buffer flush failed", {
        count: batch.length,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async close(): Promise<void> {
    this.#closed = true;
    this.#stopTimer();
    await this.flush();
  }

  #startTimer(): void {
    this.#timer = setInterval(() => {
      if (this.#queue.length > 0) {
        this.flush().catch((err) => {
          log("error", "events", "interval flush failed", {
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }
    }, this.#config.flushIntervalMs);
  }

  #stopTimer(): void {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }
}

export { EventBuffer };
export type { BufferConfig };

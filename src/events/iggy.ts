import { log } from "../util/log";

import type { EmitResult, EventInput, EventsProvider } from "./interface";

const DEFAULT_PORT = 8090;
const DEFAULT_STREAM_NAME = "omni-events";
const STREAM_ID = 1;
const DEFAULT_PARTITION_COUNT = 3;
// 90-day retention
const RETENTION_SECONDS = 90 * 24 * 60 * 60;

type IggyEventsProviderConfig = {
  /** Iggy server host */
  host?: string;
  /** Iggy server TCP port */
  port?: number;
  /** Iggy username */
  username?: string;
  /** Iggy password */
  password?: string;
  /** Default event source (e.g. "omni.runa") */
  source?: string;
  /** Default organization ID (used as topic name) */
  organizationId?: string;
  /** Iggy stream name */
  streamName?: string;
  /** Partition count for new topics */
  partitionCount?: number;
};

type ValidatedIggyConfig = IggyEventsProviderConfig & {
  host: string;
  username: string;
  password: string;
};

/**
 * Iggy events provider.
 * Publishes events directly to Iggy via TCP for co-located services.
 */
class IggyEventsProvider implements EventsProvider {
  private readonly config: ValidatedIggyConfig;
  private readonly port: number;
  private readonly streamName: string;
  private readonly partitionCount: number;
  // biome-ignore lint/suspicious/noExplicitAny: Iggy SDK types are dynamic
  private client: any = null;
  private readonly knownTopics = new Set<string>();

  constructor(config: ValidatedIggyConfig) {
    this.config = config;
    this.port = config.port ?? DEFAULT_PORT;
    this.streamName = config.streamName ?? DEFAULT_STREAM_NAME;
    this.partitionCount = config.partitionCount ?? DEFAULT_PARTITION_COUNT;
  }

  async emit(event: EventInput): Promise<EmitResult> {
    const client = await this.#requireClient();
    const topicName =
      event.organizationId ?? this.config.organizationId ?? "system";

    await this.#ensureTopic(topicName);

    const eventId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const envelope = {
      id: eventId,
      type: event.type,
      data: event.data,
      source: event.source ?? this.config.source,
      subject: event.subject,
      organizationId: topicName,
      correlationId: event.correlationId,
      schemaId: event.schemaId,
      timestamp,
    };

    const { Partitioning } = await import("@iggy.rs/sdk");
    const partition = event.subject
      ? Partitioning.MessageKey(event.subject)
      : Partitioning.Balanced;

    await client.message.send({
      streamId: STREAM_ID,
      topicId: topicName,
      messages: [{ payload: Buffer.from(JSON.stringify(envelope)) }],
      partition,
    });

    log("info", "events", "event published to Iggy", {
      eventId,
      type: event.type,
      topic: topicName,
    });

    return { eventId, timestamp };
  }

  async emitBatch(events: EventInput[]): Promise<EmitResult[]> {
    const results: EmitResult[] = [];

    for (const event of events) {
      results.push(await this.emit(event));
    }

    return results;
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
    this.client?.destroy();
    this.client = null;
    this.knownTopics.clear();
    log("info", "events", "Iggy client closed");
  }

  async #requireClient() {
    if (this.client) return this.client;

    const { Client } = await import("@iggy.rs/sdk");

    this.client = new Client({
      transport: "TCP",
      options: { host: this.config.host, port: this.port },
      credentials: {
        username: this.config.username,
        password: this.config.password,
      },
    });

    await this.#ensureStream();

    log("info", "events", "Iggy client connected", {
      host: this.config.host,
      port: this.port,
    });

    return this.client;
  }

  async #ensureStream(): Promise<void> {
    const client = this.client;

    try {
      await client.stream.get({ streamId: STREAM_ID });
    } catch {
      await client.stream.create({
        streamId: STREAM_ID,
        name: this.streamName,
      });
      log("info", "events", "created Iggy stream", {
        streamId: STREAM_ID,
        name: this.streamName,
      });
    }
  }

  async #ensureTopic(name: string): Promise<void> {
    if (this.knownTopics.has(name)) return;

    const client = await this.#requireClient();
    const { CompressionAlgorithmKind } = await import(
      "@iggy.rs/sdk/dist/wire/topic/topic.utils.js"
    );

    try {
      await client.topic.get({ streamId: STREAM_ID, topicId: name });
    } catch {
      await client.topic.create({
        streamId: STREAM_ID,
        topicId: 0,
        name,
        partitionCount: this.partitionCount,
        compressionAlgorithm: CompressionAlgorithmKind.None,
        messageExpiry: BigInt(RETENTION_SECONDS),
      });
      log("info", "events", "created Iggy topic", {
        streamId: STREAM_ID,
        topic: name,
      });
    }

    this.knownTopics.add(name);
  }
}

export { IggyEventsProvider };

export type { IggyEventsProviderConfig };

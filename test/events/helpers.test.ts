import { describe, expect, it } from "bun:test";

import type {
  RegisteredSchema,
  SchemaRegistration,
} from "../../src/events/interface";

describe("schema registration types", () => {
  it("should construct a valid SchemaRegistration", () => {
    const schema: SchemaRegistration = {
      name: "beacon.message.received",
      source: "beacon-api",
      version: 1,
      description: "A message was received on any channel",
      payloadSchema: {
        type: "object",
        properties: {
          channelId: { type: "string" },
          content: { type: "string" },
        },
      },
      enforcement: "warn",
      compatibilityMode: "backward",
    };

    expect(schema.name).toBe("beacon.message.received");
    expect(schema.source).toBe("beacon-api");
    expect(schema.version).toBe(1);
  });

  it("should construct a minimal SchemaRegistration", () => {
    const schema: SchemaRegistration = {
      name: "test.event",
      source: "test-service",
    };

    expect(schema.name).toBe("test.event");
    expect(schema.version).toBeUndefined();
  });

  it("should construct a valid RegisteredSchema", () => {
    const registered: RegisteredSchema = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "beacon.message.received",
      source: "beacon-api",
      version: 1,
      description: "A message was received",
      payloadSchema: { type: "object" },
      enforcement: "warn",
      compatibilityMode: "backward",
      previousVersionId: null,
      migrationTransform: null,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    expect(registered.id).toBeTruthy();
    expect(registered.enforcement).toBe("warn");
  });
});

import { describe, expect, it } from "bun:test";

import { SchemaCache, validateEventData } from "../../src/events/validation";

const taskSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    assigneeId: { type: "string" },
  },
  required: ["title"],
};

describe("SchemaCache", () => {
  it("stores and retrieves schemas", () => {
    const cache = new SchemaCache();
    cache.set("task.created", taskSchema);
    expect(cache.get("task.created")).toEqual(taskSchema);
  });

  it("returns undefined for unknown schemas", () => {
    const cache = new SchemaCache();
    expect(cache.get("unknown")).toBeUndefined();
  });

  it("populates from registerSchemas results", () => {
    const cache = new SchemaCache();
    cache.populate([
      {
        name: "task.created",
        enforcement: "strict",
        payloadSchema: taskSchema,
      },
    ]);
    expect(cache.get("task.created")).toEqual(taskSchema);
  });

  it("skips schemas without payloadSchema", () => {
    const cache = new SchemaCache();
    cache.populate([
      {
        name: "task.created",
        enforcement: "strict",
        payloadSchema: null,
      },
    ]);
    expect(cache.get("task.created")).toBeUndefined();
  });

  it("skips schemas with non-strict enforcement", () => {
    const cache = new SchemaCache();
    cache.populate([
      {
        name: "task.created",
        enforcement: "warn",
        payloadSchema: taskSchema,
      },
    ]);
    expect(cache.get("task.created")).toBeUndefined();
  });
});

describe("validateEventData", () => {
  it("returns valid for conforming data", () => {
    const result = validateEventData({ title: "Fix bug" }, taskSchema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns errors for non-conforming data", () => {
    const result = validateEventData({}, taskSchema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("allows extra properties by default", () => {
    const result = validateEventData(
      { title: "Fix bug", extra: true },
      taskSchema,
    );
    expect(result.valid).toBe(true);
  });
});

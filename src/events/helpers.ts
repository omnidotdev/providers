import { log } from "../util/log";

import type { RegisteredSchema, SchemaRegistration } from "./interface";

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Register event schemas with the Vortex API.
 * Idempotent — existing name+version combinations return the current schema.
 *
 * @param baseUrl - Vortex API base URL
 * @param apiKey - API key for authentication
 * @param schemas - Schemas to register
 * @returns Registered schema records
 */
const registerSchemas = async (
  baseUrl: string,
  apiKey: string,
  schemas: SchemaRegistration[],
): Promise<RegisteredSchema[]> => {
  const results: RegisteredSchema[] = [];

  for (const schema of schemas) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/schemas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({
          name: schema.name,
          source: schema.source,
          version: schema.version ?? 1,
          description: schema.description,
          payloadSchema: schema.payloadSchema,
          enforcement: schema.enforcement,
          compatibilityMode: schema.compatibilityMode,
          migrationTransform: schema.migrationTransform,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        log("error", "events", "schema registration failed", {
          name: schema.name,
          status: response.status,
        });
        continue;
      }

      const { schema: registered } = (await response.json()) as {
        schema: RegisteredSchema;
        created: boolean;
      };

      results.push(registered);

      log("info", "events", "schema registered", {
        name: registered.name,
        version: registered.version,
        id: registered.id,
      });
    } catch (err) {
      log("error", "events", "schema registration error", {
        name: schema.name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
};

export { registerSchemas };

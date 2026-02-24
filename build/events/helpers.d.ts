import type { RegisteredSchema, SchemaRegistration } from "./interface";
/**
 * Register event schemas with the Vortex API.
 * Idempotent — existing name+version combinations return the current schema.
 *
 * @param baseUrl - Vortex API base URL
 * @param apiKey - API key for authentication
 * @param schemas - Schemas to register
 * @returns Registered schema records
 */
declare const registerSchemas: (baseUrl: string, apiKey: string, schemas: SchemaRegistration[]) => Promise<RegisteredSchema[]>;
export { registerSchemas };

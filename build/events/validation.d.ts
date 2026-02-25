type ValidationResult = {
    valid: boolean;
    errors: string[];
};
type CacheableSchema = {
    name: string;
    enforcement: string;
    payloadSchema: Record<string, unknown> | null;
};
/**
 * In-memory cache of JSON Schemas for pre-emission validation.
 * Only caches schemas with `enforcement: "strict"`.
 */
declare class SchemaCache {
    #private;
    set(name: string, schema: Record<string, unknown>): void;
    get(name: string): Record<string, unknown> | undefined;
    /**
     * Populate cache from schema registration results.
     * Only caches schemas with `enforcement: "strict"` and
     * a non-null `payloadSchema`.
     */
    populate(schemas: CacheableSchema[]): void;
    has(name: string): boolean;
    clear(): void;
}
/**
 * Validate event data against a JSON Schema using Ajv.
 * @param data - Event payload to validate
 * @param schema - JSON Schema to validate against
 */
declare const validateEventData: (data: Record<string, unknown>, schema: Record<string, unknown>) => ValidationResult;
export { SchemaCache, validateEventData };
export type { CacheableSchema, ValidationResult };

import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true });

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
class SchemaCache {
  readonly #schemas = new Map<string, Record<string, unknown>>();

  set(name: string, schema: Record<string, unknown>): void {
    this.#schemas.set(name, schema);
  }

  get(name: string): Record<string, unknown> | undefined {
    return this.#schemas.get(name);
  }

  /**
   * Populate cache from schema registration results.
   * Only caches schemas with `enforcement: "strict"` and
   * a non-null `payloadSchema`.
   */
  populate(schemas: CacheableSchema[]): void {
    for (const s of schemas) {
      if (s.enforcement === "strict" && s.payloadSchema) {
        this.#schemas.set(s.name, s.payloadSchema);
      }
    }
  }

  has(name: string): boolean {
    return this.#schemas.has(name);
  }

  clear(): void {
    this.#schemas.clear();
  }
}

/**
 * Validate event data against a JSON Schema using Ajv.
 * @param data - Event payload to validate
 * @param schema - JSON Schema to validate against
 */
const validateEventData = (
  data: Record<string, unknown>,
  schema: Record<string, unknown>,
): ValidationResult => {
  const validate = ajv.compile(schema);
  const valid = validate(data) as boolean;

  return {
    valid,
    errors: valid
      ? []
      : (validate.errors ?? []).map(
          (e) => `${e.instancePath || "/"}: ${e.message ?? "unknown"}`,
        ),
  };
};

export { SchemaCache, validateEventData };

export type { CacheableSchema, ValidationResult };

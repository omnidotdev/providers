type LogLevel = "info" | "warn" | "error";
/**
 * Structured JSON logger for provider events.
 * Consumers can replace this with their own logger.
 */
declare function log(level: LogLevel, module: string, message: string, data?: Record<string, unknown>): void;
export { log };
export type { LogLevel };

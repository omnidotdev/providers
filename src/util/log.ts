type LogLevel = "info" | "warn" | "error";

/**
 * Structured JSON logger for provider events.
 * Consumers can replace this with their own logger.
 */
function log(
  level: LogLevel,
  module: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  const entry = {
    level,
    module,
    message,
    ...data,
    timestamp: new Date().toISOString(),
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.info(JSON.stringify(entry));
  }
}

export { log };

/**
 * Content moderation via Say Less.
 *
 * A thin, swappable client with a configurable failure stance. With no `url`,
 * moderation is a noop that allows everything (a service with no provider
 * cannot block content). When configured, text is checked against the Say Less
 * `/check` endpoint.
 *
 * On a provider error, timeout, or non-200 the client fails OPEN (allow) by
 * default, so an outage never blocks legitimate input. Public-serve paths that
 * must not leak unscreened content should set `failClosed: true`, which treats
 * any such failure as flagged.
 */

/** Outcome of a moderation check. */
export interface ModerationResult {
  flagged: boolean;
}

/** Configuration for {@link createModerator}. */
export interface ModeratorConfig {
  /** Say Less base URL. Absent disables moderation (allow all). */
  url?: string;
  /**
   * Failure stance. `false` (default) allows content on any provider
   * error/timeout/non-200; `true` flags it. Use `true` on public-serve paths.
   */
  failClosed?: boolean;
  /** Request timeout in milliseconds. Defaults to 2000. */
  timeoutMs?: number;
  /** Injectable fetch, for testing. Defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
}

/** A moderation client. */
export interface Moderator {
  moderateText(text: string): Promise<ModerationResult>;
}

const DEFAULT_TIMEOUT_MS = 2000;

/** Parse the Say Less `/check` response (`{ result: { flagged } }`). */
const parseResponse = (payload: unknown): ModerationResult => ({
  flagged: Boolean(
    (payload as { result?: { flagged?: unknown } } | null)?.result?.flagged,
  ),
});

/** Create a moderation client bound to a provider URL and failure stance. */
export const createModerator = (config?: ModeratorConfig): Moderator => {
  const url = config?.url;
  const failClosed = config?.failClosed ?? false;
  const timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = config?.fetchImpl ?? fetch;

  const onFailure = (reason: string): ModerationResult => {
    console.error(
      `[moderation] ${reason}; ${failClosed ? "blocking (fail closed)" : "allowing (fail open)"}`,
    );
    return { flagged: failClosed };
  };

  return {
    async moderateText(text: string): Promise<ModerationResult> {
      if (!url || !text.trim()) return { flagged: false };

      try {
        const response = await fetchImpl(`${url}/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!response.ok) {
          return onFailure(`Say Less returned ${response.status}`);
        }
        return parseResponse(await response.json());
      } catch (error) {
        return onFailure(
          `check failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  };
};

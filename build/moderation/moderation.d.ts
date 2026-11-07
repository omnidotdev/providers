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
/** Create a moderation client bound to a provider URL and failure stance. */
export declare const createModerator: (config?: ModeratorConfig) => Moderator;

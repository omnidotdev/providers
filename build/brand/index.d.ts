/**
 * Omni brand presence: the organization's own canonical social links.
 *
 * Single source of truth so every product links to the same profiles instead of
 * hardcoding URLs per app or per footer, the same treatment `LEGAL_URLS` gets.
 * Mirrors omni-api's catalog SSOT (api-stack `src/lib/db/catalog/socials.ts`);
 * if they diverge, omni-api wins.
 *
 * NB: distinct from `./social`, which is the Gatekeeper social-connections
 * provider (managing a user's linked accounts). This module is static brand
 * data, not a runtime provider.
 */
export type OmniSocial = {
    /** Platform identifier (matches the key) */
    platform: string;
    /** Human-readable label for screen readers and UI */
    label: string;
    /** Canonical profile URL */
    url: string;
};
export declare const OMNI_SOCIALS: {
    readonly threads: {
        readonly platform: "threads";
        readonly label: "Threads";
        readonly url: "https://www.threads.com/@omnidotdev";
    };
    readonly x: {
        readonly platform: "x";
        readonly label: "X";
        readonly url: "https://x.com/omnidotdev";
    };
    readonly discord: {
        readonly platform: "discord";
        readonly label: "Discord";
        readonly url: "https://discord.gg/omnidotdev";
    };
    readonly github: {
        readonly platform: "github";
        readonly label: "GitHub";
        readonly url: "https://github.com/omnidotdev";
    };
    readonly linkedin: {
        readonly platform: "linkedin";
        readonly label: "LinkedIn";
        readonly url: "https://www.linkedin.com/company/omnidotdev";
    };
};
/**
 * All Omni social links in a stable display order (Threads, X, Discord, GitHub,
 * LinkedIn), for footers and social rows that render the full set.
 */
export declare const OMNI_SOCIAL_LINKS: readonly [{
    readonly platform: "threads";
    readonly label: "Threads";
    readonly url: "https://www.threads.com/@omnidotdev";
}, {
    readonly platform: "x";
    readonly label: "X";
    readonly url: "https://x.com/omnidotdev";
}, {
    readonly platform: "discord";
    readonly label: "Discord";
    readonly url: "https://discord.gg/omnidotdev";
}, {
    readonly platform: "github";
    readonly label: "GitHub";
    readonly url: "https://github.com/omnidotdev";
}, {
    readonly platform: "linkedin";
    readonly label: "LinkedIn";
    readonly url: "https://www.linkedin.com/company/omnidotdev";
}];
/**
 * The creator/community-facing subset (Threads, X, Discord), for surfaces where
 * GitHub and LinkedIn are noise (e.g. a streamer application form).
 */
export declare const OMNI_COMMUNITY_SOCIAL_LINKS: readonly [{
    readonly platform: "threads";
    readonly label: "Threads";
    readonly url: "https://www.threads.com/@omnidotdev";
}, {
    readonly platform: "x";
    readonly label: "X";
    readonly url: "https://x.com/omnidotdev";
}, {
    readonly platform: "discord";
    readonly label: "Discord";
    readonly url: "https://discord.gg/omnidotdev";
}];

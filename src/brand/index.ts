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

export const OMNI_SOCIALS = {
  threads: {
    platform: "threads",
    label: "Threads",
    url: "https://www.threads.com/@omnidotdev",
  },
  x: {
    platform: "x",
    label: "X",
    url: "https://x.com/omnidotdev",
  },
  discord: {
    platform: "discord",
    label: "Discord",
    url: "https://discord.gg/omnidotdev",
  },
  github: {
    platform: "github",
    label: "GitHub",
    url: "https://github.com/omnidotdev",
  },
  linkedin: {
    platform: "linkedin",
    label: "LinkedIn",
    url: "https://www.linkedin.com/company/omnidotdev",
  },
} as const satisfies Record<string, OmniSocial>;

/**
 * All Omni social links in a stable display order (Threads, X, Discord, GitHub,
 * LinkedIn), for footers and social rows that render the full set.
 */
export const OMNI_SOCIAL_LINKS = [
  OMNI_SOCIALS.threads,
  OMNI_SOCIALS.x,
  OMNI_SOCIALS.discord,
  OMNI_SOCIALS.github,
  OMNI_SOCIALS.linkedin,
] as const;

/**
 * The creator/community-facing subset (Threads, X, Discord), for surfaces where
 * GitHub and LinkedIn are noise (e.g. a streamer application form).
 */
export const OMNI_COMMUNITY_SOCIAL_LINKS = [
  OMNI_SOCIALS.threads,
  OMNI_SOCIALS.x,
  OMNI_SOCIALS.discord,
] as const;

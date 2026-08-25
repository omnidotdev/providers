// src/brand/index.ts
var OMNI_SOCIALS = {
  threads: {
    platform: "threads",
    label: "Threads",
    url: "https://www.threads.com/@omnidotdev"
  },
  x: {
    platform: "x",
    label: "X",
    url: "https://x.com/omnidotdev"
  },
  discord: {
    platform: "discord",
    label: "Discord",
    url: "https://discord.gg/omnidotdev"
  },
  github: {
    platform: "github",
    label: "GitHub",
    url: "https://github.com/omnidotdev"
  },
  linkedin: {
    platform: "linkedin",
    label: "LinkedIn",
    url: "https://www.linkedin.com/company/omnidotdev"
  }
};
var OMNI_SOCIAL_LINKS = [
  OMNI_SOCIALS.threads,
  OMNI_SOCIALS.x,
  OMNI_SOCIALS.discord,
  OMNI_SOCIALS.github,
  OMNI_SOCIALS.linkedin
];
var OMNI_COMMUNITY_SOCIAL_LINKS = [
  OMNI_SOCIALS.threads,
  OMNI_SOCIALS.x,
  OMNI_SOCIALS.discord
];
export {
  OMNI_COMMUNITY_SOCIAL_LINKS,
  OMNI_SOCIALS,
  OMNI_SOCIAL_LINKS
};

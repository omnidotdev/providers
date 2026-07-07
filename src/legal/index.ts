/**
 * Canonical Omni legal URLs. Single source of truth so every product links to
 * the same policy pages; never hardcode these URLs in product code
 */
export const LEGAL_BASE_URL = "https://omni.dev/legal";

export const LEGAL_URLS = {
  hub: LEGAL_BASE_URL,
  privacy: `${LEGAL_BASE_URL}/privacy`,
  terms: `${LEGAL_BASE_URL}/terms`,
  dpa: `${LEGAL_BASE_URL}/dpa`,
  ferpa: `${LEGAL_BASE_URL}/ferpa`,
  subprocessors: `${LEGAL_BASE_URL}/subprocessors`,
  acceptableUse: `${LEGAL_BASE_URL}/acceptable-use`,
} as const;

/** Legal contact addresses */
export const LEGAL_CONTACTS = {
  privacy: "privacy@omni.dev",
  support: "support@omni.dev",
  abuse: "abuse@omni.dev",
} as const;

/** Ordered links for product footers (the two users always expect) */
export const LEGAL_FOOTER_LINKS = [
  { label: "Privacy Policy", href: LEGAL_URLS.privacy },
  { label: "Terms of Service", href: LEGAL_URLS.terms },
] as const;

/** All legal documents, for a full legal index or expanded footer */
export const LEGAL_LINKS = [
  { label: "Privacy Policy", href: LEGAL_URLS.privacy },
  { label: "Terms of Service", href: LEGAL_URLS.terms },
  { label: "Data Processing Agreement", href: LEGAL_URLS.dpa },
  { label: "FERPA Addendum", href: LEGAL_URLS.ferpa },
  { label: "Sub-processors", href: LEGAL_URLS.subprocessors },
  { label: "Acceptable Use Policy", href: LEGAL_URLS.acceptableUse },
] as const;

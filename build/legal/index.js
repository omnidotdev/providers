// src/legal/index.ts
var LEGAL_BASE_URL = "https://omni.dev/legal";
var LEGAL_URLS = {
  hub: LEGAL_BASE_URL,
  privacy: `${LEGAL_BASE_URL}/privacy`,
  terms: `${LEGAL_BASE_URL}/terms`,
  dpa: `${LEGAL_BASE_URL}/dpa`,
  subprocessors: `${LEGAL_BASE_URL}/subprocessors`,
  acceptableUse: `${LEGAL_BASE_URL}/acceptable-use`
};
var LEGAL_CONTACTS = {
  privacy: "privacy@omni.dev",
  support: "support@omni.dev",
  abuse: "abuse@omni.dev"
};
var LEGAL_FOOTER_LINKS = [
  { label: "Privacy Policy", href: LEGAL_URLS.privacy },
  { label: "Terms of Service", href: LEGAL_URLS.terms }
];
var LEGAL_LINKS = [
  { label: "Privacy Policy", href: LEGAL_URLS.privacy },
  { label: "Terms of Service", href: LEGAL_URLS.terms },
  { label: "Data Processing Agreement", href: LEGAL_URLS.dpa },
  { label: "Sub-processors", href: LEGAL_URLS.subprocessors },
  { label: "Acceptable Use Policy", href: LEGAL_URLS.acceptableUse }
];
export {
  LEGAL_URLS,
  LEGAL_LINKS,
  LEGAL_FOOTER_LINKS,
  LEGAL_CONTACTS,
  LEGAL_BASE_URL
};

/**
 * Canonical Omni legal URLs. Single source of truth so every product links to
 * the same policy pages; never hardcode these URLs in product code
 */
export declare const LEGAL_BASE_URL = "https://omni.dev/legal";
export declare const LEGAL_URLS: {
    readonly hub: "https://omni.dev/legal";
    readonly privacy: "https://omni.dev/legal/privacy";
    readonly terms: "https://omni.dev/legal/terms";
    readonly dpa: "https://omni.dev/legal/dpa";
    readonly ferpa: "https://omni.dev/legal/ferpa";
    readonly subprocessors: "https://omni.dev/legal/subprocessors";
    readonly acceptableUse: "https://omni.dev/legal/acceptable-use";
};
/** Legal contact addresses */
export declare const LEGAL_CONTACTS: {
    readonly privacy: "privacy@omni.dev";
    readonly support: "support@omni.dev";
    readonly abuse: "abuse@omni.dev";
};
/** Ordered links for product footers (the two users always expect) */
export declare const LEGAL_FOOTER_LINKS: readonly [{
    readonly label: "Privacy Policy";
    readonly href: "https://omni.dev/legal/privacy";
}, {
    readonly label: "Terms of Service";
    readonly href: "https://omni.dev/legal/terms";
}];
/** All legal documents, for a full legal index or expanded footer */
export declare const LEGAL_LINKS: readonly [{
    readonly label: "Privacy Policy";
    readonly href: "https://omni.dev/legal/privacy";
}, {
    readonly label: "Terms of Service";
    readonly href: "https://omni.dev/legal/terms";
}, {
    readonly label: "Data Processing Agreement";
    readonly href: "https://omni.dev/legal/dpa";
}, {
    readonly label: "FERPA Addendum";
    readonly href: "https://omni.dev/legal/ferpa";
}, {
    readonly label: "Sub-processors";
    readonly href: "https://omni.dev/legal/subprocessors";
}, {
    readonly label: "Acceptable Use Policy";
    readonly href: "https://omni.dev/legal/acceptable-use";
}];

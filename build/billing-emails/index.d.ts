/**
 * Shared billing-email content for the Omni ecosystem: product-name resolution
 * plus branded, product-named notification templates (payment failed, receipt,
 * renewal reminder, trial, spend/credit alerts, canceled). Single source of
 * truth so every product (Aether-routed subscriptions, plus products with their
 * own Stripe integration like Halo/Crystal) renders the same branded emails
 * instead of each reimplementing them.
 *
 * Pure content only: each builder returns a `{ subject, html }`. Delivery is the
 * caller's job (e.g. the notifications provider / Herald).
 */
/**
 * Human-readable product name from an app id, normalized across the catalog:
 * `fractal` -> `Fractal`, `see-less` -> `See Less`, `myfi` -> `MyFi`. Returns
 * undefined for a missing id (templates then degrade to a generic label).
 */
export declare function productNameFromAppId(appId?: string): string | undefined;
export interface BillingTemplate {
    subject: string;
    html: string;
}
/** Sent when an invoice payment fails. */
export declare const paymentFailedTemplate: (opts?: {
    productName?: string;
    planName?: string;
    manageBillingUrl?: string;
}) => BillingTemplate;
/**
 * Payment receipt, sent after a successful charge. Replaces a generic provider
 * receipt so the product is named.
 */
export declare const paymentReceiptTemplate: (opts?: {
    productName?: string;
    planName?: string;
    amount?: string;
    paidOn?: string;
    manageBillingUrl?: string;
}) => BillingTemplate;
/**
 * Sent ahead of a subscription's automatic renewal, naming the product in the
 * subject.
 */
export declare const renewalReminderTemplate: (opts?: {
    productName?: string;
    planName?: string;
    renewsOn?: string;
    amount?: string;
    manageBillingUrl?: string;
}) => BillingTemplate;
/**
 * Sent when a subscription is canceled. States which product/plan was canceled
 * and when access ends; deliberately carries NO resubscribe CTA.
 */
export declare const subscriptionCanceledTemplate: (opts?: {
    productName?: string;
    planName?: string;
    accessEndsAt?: string;
}) => BillingTemplate;
/** Sent as usage approaches the monthly hard spending cap. */
export declare const spendWarningTemplate: (opts?: {
    productName?: string;
    percentUsed?: number;
    manageBillingUrl?: string;
}) => BillingTemplate;
/** Sent when the user-configured soft spending threshold is crossed. */
export declare const softLimitReachedTemplate: (opts?: {
    productName?: string;
    manageBillingUrl?: string;
}) => BillingTemplate;
/** Sent when the monthly hard spending cap is reached and metered usage paused. */
export declare const spendLimitReachedTemplate: (opts?: {
    productName?: string;
    manageBillingUrl?: string;
}) => BillingTemplate;
/** Sent when a billing account's included credits are used up. */
export declare const creditsExhaustedTemplate: (opts?: {
    productName?: string;
    manageBillingUrl?: string;
}) => BillingTemplate;
/** Sent when a no-card trial ends and the workspace is paused. */
export declare const trialPausedTemplate: (opts?: {
    productName?: string;
    graceDays?: number;
    manageBillingUrl?: string;
}) => BillingTemplate;
/** Sent ahead of a trial ending. */
export declare const trialEndingTemplate: (opts?: {
    productName?: string;
    planName?: string;
    trialEnd?: string;
    manageBillingUrl?: string;
}) => BillingTemplate;
/**
 * Sent when a metered-usage overage charge fails (the invoice for
 * beyond-plan usage could not be collected). Action-required, like a failed
 * subscription payment: without a working payment method the metered services
 * are at risk of being paused.
 */
export declare const overageChargeFailedTemplate: (opts?: {
    productName?: string;
    amount?: string;
    manageBillingUrl?: string;
}) => BillingTemplate;
/**
 * Receipt for a one-time credit purchase (a top-up, not a subscription charge).
 * Confirms the credits were added; deliberately a receipt, not action-required.
 */
export declare const creditPurchaseReceiptTemplate: (opts?: {
    productName?: string;
    amount?: string;
    credits?: string;
    paidOn?: string;
    manageBillingUrl?: string;
}) => BillingTemplate;

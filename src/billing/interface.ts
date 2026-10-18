/** Entitlement from billing service */
type Entitlement = {
  id: string;
  productId: string;
  featureKey: string;
  value: string | null;
  source: string;
  validFrom: string;
  validUntil: string | null;
};

/** Entitlements response from billing service */
type EntitlementsResponse = {
  billingAccountId: string;
  entityType: string;
  entityId: string;
  entitlementVersion: number;
  entitlements: Entitlement[];
};

/**
 * Result type for entitlements fetch.
 * Distinguishes between "service unavailable" and "no entitlements found".
 */
type EntitlementsResult =
  | { status: "success"; data: EntitlementsResponse }
  | { status: "not_found" }
  | { status: "unavailable"; error: string };

/** Subscription details */
type Subscription = {
  id: string;
  status: string;
  cancelAt: number | null;
  currentPeriodEnd: number;
  priceId: string;
  product: {
    id: string;
    name: string;
    description: string | null;
    marketing_features: Array<{ name: string }>;
  } | null;
};

/**
 * Optional billing portal deep-link flow.
 * Opens the portal directly on an update or cancel flow for a subscription.
 */
type PortalFlow = {
  type: "subscription_update" | "subscription_cancel";
  subscriptionId: string;
};

/** Product information */
type Product = {
  id: string;
  name: string;
  description: string | null;
  marketing_features: Array<{ name: string }>;
};

/** Recurring billing details */
type Recurring = {
  interval: "day" | "week" | "month" | "year";
  interval_count: number;
  meter?: string | null;
  trial_period_days?: number | null;
  usage_type?: "licensed" | "metered";
};

/** Price with expanded product */
type Price = {
  id: string;
  active: boolean;
  currency: string;
  unit_amount: number | null;
  recurring: Recurring | null;
  product: Product;
  metadata: Record<string, string>;
};

/** Checkout session parameters */
type CheckoutParams = {
  priceId: string;
  successUrl: string;
  customerEmail: string;
  customerName?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  bundleSlug?: string;
  /** Free trial duration in days (0 to disable, defaults to 14 in Aether) */
  trialPeriodDays?: number;
};

/**
 * Checkout with workspace parameters.
 * Either workspaceId (upgrade existing) or createWorkspace (new) must be provided.
 */
type CheckoutWithWorkspaceParams = {
  appId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  bundleSlug?: string;
  accessToken: string;
  /** Quantity for line items */
  quantity?: number;
  /** Free trial duration in days (0 to disable, defaults to 14 in Aether) */
  trialPeriodDays?: number;
  /** Upgrade existing workspace */
  workspaceId?: string;
  /** Create new workspace */
  createWorkspace?: {
    name: string;
    slug?: string;
  };
};

/** Checkout with workspace response */
type CheckoutWithWorkspaceResponse = {
  checkoutUrl: string;
  workspaceSlug: string;
  organizationId: string;
};

/** An entity's spendable credit balance (one shared pool per billing account). */
type CreditBalance = {
  billingAccountId: string;
  balance: number;
};

/** Whether a balance covers a requested amount. */
type CreditCheck = {
  sufficient: boolean;
  balance: number;
};

/** Credit types a caller may add (system flows own `debit`/`expiration`). */
type CreditAddType = "purchase" | "grant" | "refund" | "adjustment";

/** Optional metadata on a credit write. `idempotencyKey` dedupes a retried write. */
type CreditWriteOptions = {
  description?: string;
  idempotencyKey?: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Result of a credit deduction. Fail-closed: only `success` means the spend was
 * recorded. `insufficient` is the balance-too-low case (Aether's 402), and
 * `unavailable` is a transport/service error, which a caller must treat as "do
 * not allow the spend" rather than conflate with success.
 */
type CreditDeductResult =
  | { status: "success"; balance: number; transactionId?: string }
  | { status: "insufficient"; balance: number }
  | { status: "unavailable"; error: string };

/** Result of adding credit. `duplicate` is true when the idempotency key replayed. */
type CreditAddResult = {
  balance: number;
  transactionId: string;
  duplicate: boolean;
};

/**
 * Billing provider interface.
 * Implementations check feature access and limits.
 */
interface BillingProvider {
  /**
   * Get all entitlements for an entity.
   */
  getEntitlements(
    entityType: string,
    entityId: string,
    productId?: string,
    accessToken?: string,
  ): Promise<EntitlementsResponse | null>;

  /**
   * Get all entitlements for an entity, distinguishing a no-account (`not_found`)
   * from an Aether error (`unavailable`). Use this when the caller must fail
   * closed safely: a `null` from {@link getEntitlements} conflates the two.
   */
  getEntitlementsResult(
    entityType: string,
    entityId: string,
    productId?: string,
    accessToken?: string,
  ): Promise<EntitlementsResult>;

  /**
   * Check if an entity has a specific entitlement.
   * @returns The entitlement value or null if not found
   */
  checkEntitlement(
    entityType: string,
    entityId: string,
    productId: string,
    featureKey: string,
    accessToken?: string,
  ): Promise<string | null>;

  /** Get available prices for an app */
  getPrices(appName: string): Promise<Price[]>;

  /**
   * Create a checkout session for a new subscription.
   * @deprecated Use createCheckoutWithWorkspace for new implementations
   */
  createCheckoutSession(params: CheckoutParams): Promise<string>;

  /**
   * Create a checkout session with workspace creation/selection.
   * Routes through Aether for orchestration.
   */
  createCheckoutWithWorkspace(
    params: CheckoutWithWorkspaceParams,
  ): Promise<CheckoutWithWorkspaceResponse>;

  /** Get subscription details for an entity */
  getSubscription(
    entityType: string,
    entityId: string,
    accessToken: string,
  ): Promise<Subscription | null>;

  /** List active subscriptions for an entity */
  listSubscriptions(
    entityType: string,
    entityId: string,
    accessToken: string,
  ): Promise<Subscription[]>;

  /**
   * Get billing portal URL for an entity.
   * Pass `flow` to deep-link straight into an update/cancel flow.
   */
  getBillingPortalUrl(
    entityType: string,
    entityId: string,
    productId: string,
    returnUrl: string,
    accessToken: string,
    flow?: PortalFlow,
  ): Promise<string>;

  /** Cancel a subscription */
  cancelSubscription(
    entityType: string,
    entityId: string,
    accessToken: string,
  ): Promise<string>;

  /** Renew a subscription (remove scheduled cancellation) */
  renewSubscription(
    entityType: string,
    entityId: string,
    accessToken: string,
  ): Promise<void>;

  /**
   * Get an entity's spendable credit balance (one account-level pool, shared
   * across products). Returns null when no billing account or on error.
   */
  getCreditBalance(
    entityType: string,
    entityId: string,
  ): Promise<CreditBalance | null>;

  /** Check whether an entity's balance covers `amount`. Fails closed on error. */
  checkCredits(
    entityType: string,
    entityId: string,
    amount: number,
  ): Promise<CreditCheck>;

  /**
   * Deduct credit from an entity's balance (atomic, fail-closed). Pass an
   * `idempotencyKey` so a retried deduct is not double-charged. See
   * {@link CreditDeductResult}: only `success` means the spend was recorded.
   */
  deductCredits(
    entityType: string,
    entityId: string,
    amount: number,
    options?: CreditWriteOptions,
  ): Promise<CreditDeductResult>;

  /** Add credit to an entity's balance (purchase/grant/refund/adjustment). */
  addCredits(
    entityType: string,
    entityId: string,
    amount: number,
    type: CreditAddType,
    options?: CreditWriteOptions,
  ): Promise<CreditAddResult | null>;

  /** Invalidate cached entitlements for an entity */
  invalidateCache?(entityType: string, entityId: string): void;

  /** Clear all cached entitlements */
  clearCache?(): void;

  /** Health check for the provider */
  healthCheck?(): Promise<{ healthy: boolean; message?: string }>;

  /** Close the provider connection (if stateful) */
  close?(): Promise<void>;
}

export type {
  BillingProvider,
  CheckoutParams,
  CreditAddResult,
  CreditAddType,
  CreditBalance,
  CreditCheck,
  CreditDeductResult,
  CreditWriteOptions,
  CheckoutWithWorkspaceParams,
  CheckoutWithWorkspaceResponse,
  Entitlement,
  EntitlementsResponse,
  EntitlementsResult,
  PortalFlow,
  Price,
  Product,
  Recurring,
  Subscription,
};

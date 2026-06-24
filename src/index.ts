// Auth

// API Key
export {
  GatekeeperApiKeyProvider,
  NoopApiKeyProvider,
  createApiKeyProvider,
} from "./apiKey";
export {
  GatekeeperOrgClient,
  GatekeeperOrgError,
  OMNI_CLAIMS_NAMESPACE,
  createAuthCache,
  createGetAuth,
  createOidcClient,
  createOmniOAuthConfig,
  ensureFreshAccessToken,
  extractOrgClaims,
  fetchUserInfo,
  isInvalidGrant,
  resolveAccessToken,
  verifyAccessToken,
} from "./auth";
// AuthZ
export {
  WARDEN_RELATIONS,
  WardenAuthzProvider,
  createAuthzProvider,
} from "./authz";
// Billing
export {
  AetherBillingProvider,
  BILLING_WRITE_FAILED_EVENT,
  NoopBillingProvider,
  createBillingProvider,
  isPermissionError,
  isWithinLimit,
  probeWriteScope,
  safePaymentWrite,
} from "./billing";
// Events
export {
  HttpEventsProvider,
  IggyEventsProvider,
  NoopEventsProvider,
  createEventsProvider,
  eventMeta,
  registerSchemas,
} from "./events";
// Flags
export {
  NoopFlagProvider,
  UnleashFlagProvider,
  createFlagProvider,
} from "./flags";
// Legal
export {
  LEGAL_BASE_URL,
  LEGAL_CONTACTS,
  LEGAL_FOOTER_LINKS,
  LEGAL_LINKS,
  LEGAL_URLS,
} from "./legal";
// Notifications
export {
  NoopNotificationProvider,
  createNotificationProvider,
} from "./notifications";
// Server
export { SECURITY_HEADERS } from "./server";
// Storage
export {
  NoopStorageProvider,
  S3StorageProvider,
  createStorageProvider,
} from "./storage";
// Utilities
export { TtlCache } from "./util/cache";
export { CircuitBreaker } from "./util/circuitBreaker";

export type {
  ApiKeyInfo,
  ApiKeyProvider,
  ApiKeyProviderConfig,
  GatekeeperApiKeyProviderConfig,
  NoopApiKeyProviderConfig,
} from "./apiKey";
export type {
  AuthCache,
  AuthCacheConfig,
  BetterAuthApi,
  CachedAuthData,
  EnsureFreshTokenConfig,
  GatekeeperInvitation,
  GatekeeperMember,
  GatekeeperMemberRole,
  GatekeeperOrganization,
  GetAuthConfig,
  GetAuthSession,
  OidcClient,
  OidcClientConfig,
  OidcDiscovery,
  OmniOAuthConfig,
  OrganizationClaim,
  ResolveAccessTokenConfig,
  SetCookieFn,
  TokenPayload,
  TokenResult,
  UserInfoClaims,
  VerifyAccessTokenConfig,
} from "./auth";
export type {
  AuthzProvider,
  AuthzProviderConfig,
  AuthzTuple,
  PermissionCheck,
  PermissionCheckResult,
  TupleSyncResult,
  WardenAuthzProviderConfig,
  WardenRelation,
  WardenResourceType,
} from "./authz";
export type {
  AetherBillingProviderConfig,
  AlertEventsProvider,
  BillingProvider,
  BillingProviderConfig,
  CheckoutParams,
  CheckoutWithWorkspaceParams,
  CheckoutWithWorkspaceResponse,
  Entitlement,
  EntitlementsResponse,
  EntitlementsResult,
  NoopBillingProviderConfig,
  Price,
  Product,
  Recurring,
  SafePaymentWriteOptions,
  ScopeProbeResult,
  Subscription,
} from "./billing";
export type {
  EmitResult,
  EventActor,
  EventInput,
  EventsProvider,
  EventsProviderConfig,
  EventsProviderStatus,
  HttpEventsProviderConfig,
  IggyEventsProviderConfig,
  NoopEventsProviderConfig,
  RegisteredSchema,
  SchemaRegistration,
  SubscriptionCreated,
  SubscriptionInput,
} from "./events";
// Note: events Subscription is not re-exported here to avoid conflict
// with billing Subscription. Import from "@omnidotdev/providers/events".
export type {
  FlagContext,
  FlagProvider,
  FlagProviderConfig,
  NoopFlagProviderConfig,
  UnleashFlagProviderConfig,
} from "./flags";
export type {
  EmailParams,
  EmailResult,
  NoopNotificationProviderConfig,
  NotificationProvider,
  NotificationProviderConfig,
} from "./notifications";
export type {
  NoopStorageProviderConfig,
  PresignedParams,
  PresignedResult,
  S3StorageProviderConfig,
  StorageProvider,
  StorageProviderConfig,
  UploadParams,
  UploadResult,
} from "./storage";
export type { TtlCacheConfig } from "./util/cache";
export type { CircuitBreakerConfig } from "./util/circuitBreaker";

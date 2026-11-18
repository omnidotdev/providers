type ObserverField = {
    name: string;
    type: string;
    /** Context key to read from. Defaults to field name */
    contextKey?: string;
};
/** GraphQL type of `Observer.identityProviderId` */
type IdentityProviderIdType = "UUID!" | "String!";
/**
 * Create an observer plugin that exposes the current authenticated user.
 * Follows the observer pattern convention — see patterns.mdx for details.
 * @param config - Optional config: extra Observer fields, and the type of
 * `identityProviderId`. It defaults to `UUID!` (Gatekeeper subjects); use
 * `String!` for an identity provider whose subjects are arbitrary strings, as
 * any OIDC provider's may be. Changing it changes the API's schema, so a
 * client that declared a `UUID` variable for it must follow
 */
declare const createObserverPlugin: (config?: {
    extraFields?: ObserverField[];
    identityProviderIdType?: IdentityProviderIdType;
}) => GraphileConfig.Plugin;
export type { IdentityProviderIdType, ObserverField };
export { createObserverPlugin };

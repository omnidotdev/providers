type ObserverField = {
    name: string;
    type: string;
    /** Context key to read from. Defaults to field name */
    contextKey?: string;
};
/**
 * Create an observer plugin that exposes the current authenticated user.
 * Follows the observer pattern convention — see patterns.mdx for details.
 * @param config - Optional config to add extra fields to the Observer type
 */
declare const createObserverPlugin: (config?: {
    extraFields?: ObserverField[];
}) => GraphileConfig.Plugin;
export { createObserverPlugin };
export type { ObserverField };

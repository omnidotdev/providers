/**
 * Plugin that restricts mutations to only expose those linked
 * by a primary key. Unique constraints get `-update -delete`
 * behavior tags, preventing mutations from being generated for them.
 */
declare const PrimaryKeyMutationsOnlyPlugin: GraphileConfig.Plugin;
export { PrimaryKeyMutationsOnlyPlugin };

/**
 * Warden authorization relation contract.
 *
 * This is the single source of truth, for consumers, of which user-assignable
 * role relations exist on each resource type in Warden's OpenFGA model. Permission
 * checks are typed against it (see {@link WardenRelation}), so passing a relation
 * that does not exist on a given resource type is a compile error rather than a
 * silent fail-closed at runtime.
 *
 * Staleness is guarded upstream: warden-api ships a contract test asserting that
 * the relations derived from its live OpenFGA model exactly match this map. When
 * Warden's model changes, that test fails until this contract is updated and
 * republished, at which point consumers re-type-check against the new shape.
 *
 * Only user-assignable roles are listed; structural/parent relations (e.g. the
 * `organization` relation on `workspace`, which links objects rather than users)
 * are intentionally excluded, since you never check a user against them.
 */
export const WARDEN_RELATIONS = {
  organization: ["owner", "admin", "member"],
  workspace: ["owner", "admin", "member"],
  project: ["owner", "admin", "editor", "member", "viewer"],
  resource: ["owner", "editor", "viewer"],
  vortex_workflow: ["owner", "editor", "viewer"],
  vortex_integration: ["owner", "editor", "viewer"],
  vortex_plugin: ["owner", "editor", "viewer"],
  vortex_mcp_server: ["owner", "editor", "viewer"],
} as const;

/** A resource type that has user-assignable role relations in Warden. */
export type WardenResourceType = keyof typeof WARDEN_RELATIONS;

/**
 * A valid user-assignable relation for a given resource type. With no type
 * argument it resolves to the union of every relation across all resource types.
 */
export type WardenRelation<T extends WardenResourceType = WardenResourceType> =
  (typeof WARDEN_RELATIONS)[T][number];

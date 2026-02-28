/**
 * Event input for publishing to Vortex.
 * Aligns with CloudEvents v1.0 plus Omni extension attributes.
 */
type EventInput = {
    /** Dot-separated event type (e.g. "beacon.message.received") */
    type: string;
    /** Event payload */
    data: Record<string, unknown>;
    /** Override provider default source (e.g. "omni.runa") */
    source?: string;
    /** Entity ID, used for partitioning */
    subject?: string;
    /** Override provider default organization ID */
    organizationId?: string;
    /** Correlation ID for distributed tracing */
    correlationId?: string;
    /** Schema ID for payload validation */
    schemaId?: string;
    /** CloudEvents spec version (default "1.0") */
    specversion?: string;
    /** Content type of `data` (default "application/json") */
    datacontenttype?: string;
    /** URI identifying the data schema */
    dataschema?: string;
    /** Omni workspace ID extension attribute */
    omniworkspaceid?: string;
    /** Omni schema version extension attribute */
    omnischemaversion?: number;
};
/** Result of a successfully emitted event */
type EmitResult = {
    eventId: string;
    timestamp: string;
};
/** Provider connection status */
type EventsProviderStatus = "connected" | "disconnected" | "degraded";
/**
 * Events provider interface.
 * Implementations emit structured events into Vortex.
 */
interface EventsProvider {
    /**
     * Emit a single event.
     * @param event - Event input
     * @returns Event ID and timestamp
     */
    emit(event: EventInput): Promise<EmitResult>;
    /**
     * Emit multiple events.
     * Implementations may batch or fan out as appropriate.
     */
    emitBatch?(events: EventInput[]): Promise<EmitResult[]>;
    /** Health check for the provider */
    healthCheck?(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    /** Close the provider connection (if stateful) */
    close?(): Promise<void>;
    /** Create a webhook subscription for event delivery */
    subscribe?(input: SubscriptionInput): Promise<SubscriptionCreated>;
    /** Delete a webhook subscription */
    unsubscribe?(subscriptionId: string): Promise<void>;
    /** List active webhook subscriptions */
    listSubscriptions?(): Promise<Subscription[]>;
}
/** Input for creating a webhook subscription */
type SubscriptionInput = {
    /** Human-readable name */
    name: string;
    /** Glob pattern to match event types (e.g. "aether.entitlement.*") */
    typePattern: string;
    /** HTTPS endpoint to deliver events to */
    targetUrl: string;
    /** Glob pattern to match event sources */
    sourcePattern?: string;
    /** Header name for HMAC signature */
    signatureHeader?: string;
    /** JSONata expression to reshape event data */
    transform?: string;
    /** "data" sends event.data only, "envelope" sends full CloudEvents */
    payloadMode?: "data" | "envelope";
    /** Maximum delivery retries */
    maxRetries?: number;
};
/** Subscription returned from list/get (no secret) */
type Subscription = {
    id: string;
    name: string;
    typePattern: string;
    targetUrl: string;
    sourcePattern: string | null;
    signatureHeader: string;
    enabled: boolean;
    createdAt: string;
};
/** Subscription returned on creation (includes secret) */
type SubscriptionCreated = Subscription & {
    hmacSecret: string;
};
/** Schema registration input for `registerSchemas` helper */
type SchemaRegistration = {
    /** Dot-separated event name (e.g. "beacon.message.received") */
    name: string;
    /** Service that emits this event (e.g. "beacon-api") */
    source: string;
    /** Monotonic version number (default 1) */
    version?: number;
    /** Human-readable description */
    description?: string;
    /** JSON Schema for the event `data` field */
    payloadSchema?: Record<string, unknown>;
    /** Enforcement level */
    enforcement?: "strict" | "warn" | "none";
    /** Schema evolution mode */
    compatibilityMode?: "backward" | "forward" | "full" | "none";
    /** JSONata expression for migrating between versions */
    migrationTransform?: string;
};
/** Schema returned from the Vortex API after registration */
type RegisteredSchema = {
    id: string;
    name: string;
    source: string;
    version: number;
    description: string | null;
    payloadSchema: Record<string, unknown> | null;
    enforcement: string;
    compatibilityMode: string;
    previousVersionId: string | null;
    migrationTransform: string | null;
    createdAt: string;
    updatedAt: string;
};
export type { EmitResult, EventInput, EventsProvider, EventsProviderStatus, RegisteredSchema, SchemaRegistration, Subscription, SubscriptionCreated, SubscriptionInput, };

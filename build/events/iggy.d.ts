import type { EmitResult, EventInput, EventsProvider } from "./interface";
type IggyEventsProviderConfig = {
    /** Iggy server host */
    host?: string;
    /** Iggy server TCP port */
    port?: number;
    /** Iggy username */
    username?: string;
    /** Iggy password */
    password?: string;
    /** Default event source (e.g. "omni.runa") */
    source?: string;
    /** Default organization ID (used as topic name) */
    organizationId?: string;
    /** Iggy stream name */
    streamName?: string;
    /** Partition count for new topics */
    partitionCount?: number;
};
type ValidatedIggyConfig = IggyEventsProviderConfig & {
    host: string;
    username: string;
    password: string;
};
/**
 * Iggy events provider.
 * Publishes events directly to Iggy via TCP for co-located services.
 */
declare class IggyEventsProvider implements EventsProvider {
    #private;
    private readonly config;
    private readonly port;
    private readonly streamName;
    private readonly partitionCount;
    private client;
    private readonly knownTopics;
    constructor(config: ValidatedIggyConfig);
    emit(event: EventInput): Promise<EmitResult>;
    emitBatch(events: EventInput[]): Promise<EmitResult[]>;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
}
export { IggyEventsProvider };
export type { IggyEventsProviderConfig };

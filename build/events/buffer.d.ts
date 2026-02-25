import type { EmitResult, EventInput } from "./interface";
type BufferConfig = {
    /** Max events before auto-flush (default 50) */
    maxSize: number;
    /** Flush interval in milliseconds (default 100) */
    flushIntervalMs: number;
};
type FlushFn = (events: EventInput[]) => Promise<EmitResult[]>;
/**
 * Local event buffer with flush-by-size and flush-by-time.
 *
 * Queues events locally and flushes when either the buffer
 * reaches `maxSize` or `flushIntervalMs` elapses.
 */
declare class EventBuffer {
    #private;
    constructor(config: BufferConfig, flushFn: FlushFn);
    add(event: EventInput): Promise<void>;
    flush(): Promise<EmitResult[]>;
    close(): Promise<void>;
}
export { EventBuffer };
export type { BufferConfig };

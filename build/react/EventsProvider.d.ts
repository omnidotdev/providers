import type { PropsWithChildren } from "react";
import type { EventsProvider as EventsProviderInterface } from "../events/interface";
/**
 * React context provider for events.
 * Accepts a pre-created `EventsProvider` instance and makes it
 * available to the component tree via `useEvents()`.
 */
declare const EventsProvider: ({ children, provider, }: PropsWithChildren<{
    provider: EventsProviderInterface;
}>) => import("react/jsx-runtime").JSX.Element;
/**
 * Hook to access the events provider.
 * Returns null if used outside EventsProvider.
 */
declare const useEvents: () => EventsProviderInterface | null;
export { EventsProvider, useEvents };

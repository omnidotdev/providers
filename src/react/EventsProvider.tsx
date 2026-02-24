import { createContext, use } from "react";

import type { PropsWithChildren } from "react";
import type { EventsProvider as EventsProviderInterface } from "../events/interface";

const EventsContext = createContext<EventsProviderInterface | null>(null);

/**
 * React context provider for events.
 * Accepts a pre-created `EventsProvider` instance and makes it
 * available to the component tree via `useEvents()`.
 */
const EventsProvider = ({
  children,
  provider,
}: PropsWithChildren<{
  provider: EventsProviderInterface;
}>) => {
  return <EventsContext value={provider}>{children}</EventsContext>;
};

/**
 * Hook to access the events provider.
 * Returns null if used outside EventsProvider.
 */
const useEvents = () => {
  return use(EventsContext);
};

export { EventsProvider, useEvents };

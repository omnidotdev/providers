import { afterEach, describe, expect, it } from "bun:test";

import { cleanup, render, screen } from "@testing-library/react";

import { NoopEventsProvider } from "../../src/events/noop";
import { EventsProvider, useEvents } from "../../src/react/EventsProvider";

afterEach(cleanup);

const noopProvider = new NoopEventsProvider();

/** Test component that reads the events context */
function ConsumerComponent() {
  const events = useEvents();
  if (!events) return <div>no context</div>;
  return <div data-testid="has-provider">provider available</div>;
}

describe("EventsProvider", () => {
  it("provides events provider to children", () => {
    render(
      <EventsProvider provider={noopProvider}>
        <ConsumerComponent />
      </EventsProvider>,
    );

    expect(screen.getByTestId("has-provider").textContent).toBe(
      "provider available",
    );
  });

  it("renders children", () => {
    render(
      <EventsProvider provider={noopProvider}>
        <div data-testid="child">hello</div>
      </EventsProvider>,
    );

    expect(screen.getByTestId("child").textContent).toBe("hello");
  });
});

describe("useEvents", () => {
  it("returns null outside provider", () => {
    render(<ConsumerComponent />);
    expect(screen.getByText("no context")).toBeDefined();
  });
});

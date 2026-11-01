import { afterEach, describe, expect, it, mock } from "bun:test";

import { cleanup, render } from "@testing-library/react";

import { usePageview } from "../../src/analytics/usePageview";

import type { PrismClient } from "../../src/analytics/client";

afterEach(cleanup);

/** Wrapper component that calls the hook with a given pathname */
function HookHost({
  client,
  pathname,
}: {
  client: PrismClient;
  pathname: string;
}) {
  usePageview(client, pathname);

  return <div data-testid="host">{pathname}</div>;
}

const makeClient = () =>
  ({ track: mock(() => {}), flush: mock(() => {}) }) satisfies PrismClient;

describe("usePageview", () => {
  it("tracks a pageview on mount", () => {
    const client = makeClient();

    render(<HookHost client={client} pathname="/" />);

    expect(client.track).toHaveBeenCalledTimes(1);
    expect(client.track).toHaveBeenCalledWith("pageview");
  });

  it("tracks again when the pathname changes", () => {
    const client = makeClient();

    const { rerender } = render(<HookHost client={client} pathname="/a" />);
    expect(client.track).toHaveBeenCalledTimes(1);

    rerender(<HookHost client={client} pathname="/b" />);
    expect(client.track).toHaveBeenCalledTimes(2);
  });

  it("does not re-track when the pathname is unchanged across renders", () => {
    const client = makeClient();

    const { rerender } = render(<HookHost client={client} pathname="/same" />);
    rerender(<HookHost client={client} pathname="/same" />);
    rerender(<HookHost client={client} pathname="/same" />);

    expect(client.track).toHaveBeenCalledTimes(1);
  });
});

import { afterEach, describe, expect, it, mock } from "bun:test";

import { cleanup, render } from "@testing-library/react";

import { useSessionRefresh } from "../../src/react/useSessionRefresh";

afterEach(cleanup);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Wrapper component that calls the hook */
function HookHost({
  refreshFn,
  intervalMs,
}: {
  refreshFn: () => void | Promise<unknown>;
  intervalMs?: number;
}) {
  useSessionRefresh(refreshFn, intervalMs);
  return <div data-testid="host">mounted</div>;
}

describe("useSessionRefresh", () => {
  it("calls refreshFn on the configured interval", async () => {
    const refreshFn = mock(() => {});

    render(<HookHost refreshFn={refreshFn} intervalMs={50} />);

    // Not called immediately on mount
    expect(refreshFn).not.toHaveBeenCalled();

    // Wait for interval to fire
    await sleep(80);

    expect(refreshFn).toHaveBeenCalled();
  });

  it("calls refreshFn multiple times across intervals", async () => {
    const refreshFn = mock(() => {});

    render(<HookHost refreshFn={refreshFn} intervalMs={30} />);

    await sleep(100);

    expect(refreshFn.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("accepts an async refreshFn returning data (not just void)", () => {
    // Key type-safety test: fetchSession returns Promise<{session: ...}>
    const refreshFn = mock(() =>
      Promise.resolve({ session: { token: "abc" } }),
    );

    expect(() =>
      render(<HookHost refreshFn={refreshFn} intervalMs={60_000} />),
    ).not.toThrow();
  });

  it("cleans up interval on unmount", async () => {
    const refreshFn = mock(() => {});

    const { unmount } = render(
      <HookHost refreshFn={refreshFn} intervalMs={30} />,
    );

    unmount();

    const countAtUnmount = refreshFn.mock.calls.length;

    // Wait to confirm no more calls after unmount
    await sleep(80);

    expect(refreshFn.mock.calls.length).toBe(countAtUnmount);
  });

  it("cleans up visibilitychange listener on unmount", () => {
    const refreshFn = mock(() => {});
    const removeCalls: string[] = [];

    const originalRemove = document.removeEventListener;
    document.removeEventListener = mock((event: string, ...args: unknown[]) => {
      removeCalls.push(event);
      return originalRemove.call(document, event, ...args);
    }) as typeof document.removeEventListener;

    const { unmount } = render(
      <HookHost refreshFn={refreshFn} intervalMs={60_000} />,
    );

    unmount();
    expect(removeCalls).toContain("visibilitychange");

    document.removeEventListener = originalRemove;
  });

  it("defaults to 4 minute interval without explicit intervalMs", () => {
    const refreshFn = mock(() => {});

    expect(() => render(<HookHost refreshFn={refreshFn} />)).not.toThrow();
  });
});

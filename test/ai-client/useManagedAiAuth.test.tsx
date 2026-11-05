import { afterEach, describe, expect, it } from "bun:test";

import { act, cleanup, render } from "@testing-library/react";

import { useManagedAiAuth } from "../../src/ai-client/useManagedAiAuth";

import type { ManagedAiAuth } from "../../src/ai-client/session";

afterEach(cleanup);

/** A controllable fake ManagedAiAuth whose signed-in state can be toggled. */
const makeFakeAuth = (): ManagedAiAuth => {
  let signedIn = false;
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const l of listeners) l();
  };
  return {
    isConfigured: () => true,
    isSignedIn: () => signedIn,
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    signIn: async () => {
      signedIn = true;
      notify();
    },
    signOut: async () => {
      signedIn = false;
      notify();
    },
    completeCallback: async () => ({ ok: true, returnTo: "/" }),
    getAccessToken: async () => (signedIn ? "tok" : null),
  };
};

function HookHost({ auth }: { auth: ManagedAiAuth }) {
  const { isConfigured, isSignedIn } = useManagedAiAuth(auth);
  return (
    <div data-testid="state">{`${isConfigured ? "configured" : "off"}:${isSignedIn ? "in" : "out"}`}</div>
  );
}

describe("useManagedAiAuth", () => {
  it("reflects the initial signed-out state and re-renders on sign-in/out", async () => {
    const auth = makeFakeAuth();
    const { getByTestId } = render(<HookHost auth={auth} />);

    expect(getByTestId("state").textContent).toBe("configured:out");

    await act(async () => {
      await auth.signIn();
    });
    expect(getByTestId("state").textContent).toBe("configured:in");

    await act(async () => {
      await auth.signOut();
    });
    expect(getByTestId("state").textContent).toBe("configured:out");
  });
});

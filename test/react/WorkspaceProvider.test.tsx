import { afterEach, describe, expect, it } from "bun:test";

import { cleanup, render, screen } from "@testing-library/react";

import {
  OrganizationProvider,
  WorkspaceProvider,
  useOrganization,
  useWorkspace,
} from "../../src/react";

import type { OrganizationClaim } from "../../src/auth/types";

afterEach(cleanup);

const personalWorkspace: OrganizationClaim = {
  id: "org-1",
  name: "Personal",
  slug: "personal",
  type: "personal",
  roles: ["owner"],
  teams: [],
};

const teamWorkspace: OrganizationClaim = {
  id: "org-2",
  name: "Team Workspace",
  slug: "team-workspace",
  type: "team",
  roles: ["admin"],
  teams: [{ id: "team-1", name: "Engineering" }],
};

/** Test component that reads the workspace context */
function ConsumerComponent() {
  const ctx = useWorkspace();
  if (!ctx) return <div>no context</div>;
  return (
    <div>
      <span data-testid="current">{ctx.currentWorkspace?.name ?? "none"}</span>
      <span data-testid="count">{ctx.workspaces.length}</span>
      <span data-testid="degraded">
        {ctx.isDegradedMode ? "true" : "false"}
      </span>
      <span data-testid="multiple">
        {ctx.hasMultipleWorkspaces ? "true" : "false"}
      </span>
    </div>
  );
}

describe("WorkspaceProvider", () => {
  it("provides workspaces to children", () => {
    render(
      <WorkspaceProvider workspaces={[personalWorkspace, teamWorkspace]}>
        <ConsumerComponent />
      </WorkspaceProvider>,
    );

    expect(screen.getByTestId("count").textContent).toBe("2");
  });

  it("defaults to personal workspace", () => {
    render(
      <WorkspaceProvider workspaces={[teamWorkspace, personalWorkspace]}>
        <ConsumerComponent />
      </WorkspaceProvider>,
    );

    expect(screen.getByTestId("current").textContent).toBe("Personal");
  });

  it("falls back to first workspace when no personal workspace", () => {
    render(
      <WorkspaceProvider workspaces={[teamWorkspace]}>
        <ConsumerComponent />
      </WorkspaceProvider>,
    );

    expect(screen.getByTestId("current").textContent).toBe("Team Workspace");
  });

  it("enters degraded mode with empty workspaces", () => {
    render(
      <WorkspaceProvider workspaces={[]}>
        <ConsumerComponent />
      </WorkspaceProvider>,
    );

    expect(screen.getByTestId("degraded").textContent).toBe("true");
  });

  it("reports hasMultipleWorkspaces correctly", () => {
    render(
      <WorkspaceProvider workspaces={[personalWorkspace, teamWorkspace]}>
        <ConsumerComponent />
      </WorkspaceProvider>,
    );

    expect(screen.getByTestId("multiple").textContent).toBe("true");
  });

  it("reports single workspace correctly", () => {
    render(
      <WorkspaceProvider workspaces={[personalWorkspace]}>
        <ConsumerComponent />
      </WorkspaceProvider>,
    );

    expect(screen.getByTestId("multiple").textContent).toBe("false");
  });
});

describe("useWorkspace", () => {
  it("returns null outside provider", () => {
    render(<ConsumerComponent />);
    expect(screen.getByText("no context")).toBeDefined();
  });
});

describe("deprecated aliases", () => {
  it("OrganizationProvider + useOrganization still resolve to the workspace impl", () => {
    expect(OrganizationProvider).toBe(WorkspaceProvider);
    expect(useOrganization).toBe(useWorkspace);
  });
});

import { afterEach, describe, expect, it } from "bun:test";

import { cleanup, render, screen } from "@testing-library/react";

import {
  OrganizationProvider,
  useOrganization,
} from "../../src/react/OrganizationProvider";

import type { OrganizationClaim } from "../../src/auth/types";

afterEach(cleanup);

const personalOrg: OrganizationClaim = {
  id: "org-1",
  name: "Personal",
  slug: "personal",
  type: "personal",
  roles: ["owner"],
  teams: [],
};

const teamOrg: OrganizationClaim = {
  id: "org-2",
  name: "Team Org",
  slug: "team-org",
  type: "team",
  roles: ["admin"],
  teams: [{ id: "team-1", name: "Engineering" }],
};

/** Test component that reads the organization context */
function ConsumerComponent() {
  const ctx = useOrganization();
  if (!ctx) return <div>no context</div>;
  return (
    <div>
      <span data-testid="current">
        {ctx.currentOrganization?.name ?? "none"}
      </span>
      <span data-testid="count">{ctx.organizations.length}</span>
      <span data-testid="degraded">
        {ctx.isDegradedMode ? "true" : "false"}
      </span>
      <span data-testid="multiple">
        {ctx.hasMultipleOrgs ? "true" : "false"}
      </span>
    </div>
  );
}

describe("OrganizationProvider", () => {
  it("provides organizations to children", () => {
    render(
      <OrganizationProvider organizations={[personalOrg, teamOrg]}>
        <ConsumerComponent />
      </OrganizationProvider>,
    );

    expect(screen.getByTestId("count").textContent).toBe("2");
  });

  it("defaults to personal org", () => {
    render(
      <OrganizationProvider organizations={[teamOrg, personalOrg]}>
        <ConsumerComponent />
      </OrganizationProvider>,
    );

    expect(screen.getByTestId("current").textContent).toBe("Personal");
  });

  it("falls back to first org when no personal org", () => {
    render(
      <OrganizationProvider organizations={[teamOrg]}>
        <ConsumerComponent />
      </OrganizationProvider>,
    );

    expect(screen.getByTestId("current").textContent).toBe("Team Org");
  });

  it("enters degraded mode with empty organizations", () => {
    render(
      <OrganizationProvider organizations={[]}>
        <ConsumerComponent />
      </OrganizationProvider>,
    );

    expect(screen.getByTestId("degraded").textContent).toBe("true");
  });

  it("reports hasMultipleOrgs correctly", () => {
    render(
      <OrganizationProvider organizations={[personalOrg, teamOrg]}>
        <ConsumerComponent />
      </OrganizationProvider>,
    );

    expect(screen.getByTestId("multiple").textContent).toBe("true");
  });

  it("reports single org correctly", () => {
    render(
      <OrganizationProvider organizations={[personalOrg]}>
        <ConsumerComponent />
      </OrganizationProvider>,
    );

    expect(screen.getByTestId("multiple").textContent).toBe("false");
  });
});

describe("useOrganization", () => {
  it("returns null outside provider", () => {
    render(<ConsumerComponent />);
    expect(screen.getByText("no context")).toBeDefined();
  });
});

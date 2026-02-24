// src/react/EventsProvider.tsx
import { createContext, use } from "react";
import { jsx } from "react/jsx-runtime";
var EventsContext = createContext(null);
var EventsProvider = ({
  children,
  provider
}) => {
  return /* @__PURE__ */ jsx(EventsContext, {
    value: provider,
    children
  });
};
var useEvents = () => {
  return use(EventsContext);
};
// src/react/OrganizationProvider.tsx
import { createContext as createContext2, use as use2, useMemo, useState } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var OrganizationContext = createContext2(null);
function getDefaultOrganization(organizations) {
  const personalOrg = organizations.find((org) => org.type === "personal");
  if (personalOrg)
    return personalOrg;
  return organizations[0];
}
var OrganizationProvider = ({
  children,
  organizations
}) => {
  const isDegradedMode = organizations.length === 0;
  const defaultOrg = useMemo(() => getDefaultOrganization(organizations), [organizations]);
  const [currentOrganization, setCurrentOrgState] = useState(defaultOrg);
  const setCurrentOrganization = (orgId) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org)
      setCurrentOrgState(org);
  };
  const getOrganizationById = (orgId) => {
    return organizations.find((o) => o.id === orgId);
  };
  const hasMultipleOrgs = organizations.length > 1;
  return /* @__PURE__ */ jsx2(OrganizationContext, {
    value: {
      organizations,
      currentOrganization,
      setCurrentOrganization,
      hasMultipleOrgs,
      getOrganizationById,
      isDegradedMode
    },
    children
  });
};
var useOrganization = () => {
  return use2(OrganizationContext);
};
export {
  useOrganization,
  useEvents,
  OrganizationProvider,
  EventsProvider
};

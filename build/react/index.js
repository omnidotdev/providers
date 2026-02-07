// src/react/OrganizationProvider.tsx
import { createContext, use, useMemo, useState } from "react";
import { jsx } from "react/jsx-runtime";
var OrganizationContext = createContext(null);
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
  return /* @__PURE__ */ jsx(OrganizationContext, {
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
  return use(OrganizationContext);
};
export {
  useOrganization,
  OrganizationProvider
};

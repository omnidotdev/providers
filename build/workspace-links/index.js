// src/auth/workspaceLinks.ts
var normalizeWorkspaceLinks = (raw) => {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value))
    return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object")
      return [];
    const { url, title, visibility } = entry;
    if (typeof url !== "string")
      return [];
    return [
      {
        url,
        title: typeof title === "string" ? title : null,
        visibility: visibility === "members" ? "members" : "public"
      }
    ];
  });
};
var publicWorkspaceLinks = (raw) => normalizeWorkspaceLinks(raw).filter((link) => link.visibility !== "members");
export {
  normalizeWorkspaceLinks,
  publicWorkspaceLinks
};

// src/server/headers.ts
var SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};
var headers_default = SECURITY_HEADERS;
// src/server/identity.ts
var decodeJwtPayload = (token) => {
  const segment = token.split(".")[1];
  if (!segment)
    return null;
  try {
    const json = Buffer.from(segment, "base64url").toString("utf8");
    const payload = JSON.parse(json);
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
};
var firstCsv = (value) => {
  const first = value?.split(",")[0]?.trim();
  return first ? first : undefined;
};
var clientIp = ({
  headers,
  socketIp,
  trustProxy = true
}) => {
  if (trustProxy) {
    const forwarded = firstCsv(headers.get("x-forwarded-for"));
    if (forwarded)
      return forwarded;
    const realIp = headers.get("x-real-ip")?.trim();
    if (realIp)
      return realIp;
  }
  const socket = socketIp?.trim();
  if (socket)
    return socket;
  return "unknown";
};
var clientIpKey = (source) => `ip:${clientIp(source)}`;
var identityKey = (source) => {
  const auth = source.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token) {
      const sub = decodeJwtPayload(token)?.sub;
      if (typeof sub === "string" && sub.length > 0)
        return `user:${sub}`;
    }
  }
  return clientIpKey(source);
};
export {
  headers_default as SECURITY_HEADERS,
  clientIp,
  clientIpKey,
  identityKey
};

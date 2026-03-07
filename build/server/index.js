// src/server/headers.ts
var SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};
var headers_default = SECURITY_HEADERS;
export {
  headers_default as SECURITY_HEADERS
};

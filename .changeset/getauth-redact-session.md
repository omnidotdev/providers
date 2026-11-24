---
"@omnidotdev/providers": patch
---

`createGetAuth` no longer returns the session token, IP address, or user agent in `session`. Apps pass this result to the browser, and the token is the value of the httpOnly session cookie

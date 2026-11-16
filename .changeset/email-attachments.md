---
"@omnidotdev/providers": minor
---

Add email attachments to the notifications provider. `EmailParams` takes an optional `attachments` array of `EmailAttachment` (`filename`, `content` as raw bytes or a base64 string, optional `contentType`, and optional `contentId` for inline `cid:` images), and the Herald provider base64-encodes byte content and forwards the files on every recipient's message. `EmailAttachment` is exported from the root and `./notifications` entry points. Herald enforces the limits (at most 20 files and 25 MiB total per message, executable and script types refused); a refused attachment returns `{ success: false }` with Herald's reason and is not retried.

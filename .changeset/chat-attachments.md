---
"@omnidotdev/providers": minor
---

Add `@omnidotdev/providers/attachments`, the server side of chat attachments shared by every Omni chat product. `prepareAttachments` runs the whole check in one call: images and files are validated by their bytes (PNG, JPEG, WebP, GIF; PDF, plain text, Markdown, CSV) against shared limits (3 per message, 2 MB per image, 5 MB and 30 pages per PDF, 200 KB per text file), images are screened through See Less and refused on anything but an explicit allow (an outage or missing config in production refuses too), image metadata (EXIF, XMP, text chunks; a rotated photo keeps its orientation) is removed, and each file's text is read for the model. The pieces (`parseImages`, `parseDocuments`, `screenImages`, `checkImage`, `stripImageMetadata`, `imageSize`, `readDocuments`, `readPdfText`, `attachedFileBlocks`) are exported for products that run them in their own order. PDF text needs `unpdf`, a new optional peer

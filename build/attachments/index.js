// src/attachments/types.ts
var IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif"
];
var DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv"
];
var DEFAULT_ATTACHMENT_LIMITS = {
  maxAttachments: 3,
  maxImages: 3,
  maxImageBytes: 2000000,
  maxPdfBytes: 5000000,
  maxTextFileBytes: 200000,
  maxPdfPages: 30,
  maxDocumentChars: 30000
};

// src/attachments/parse.ts
var BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
var decodedLength = (data) => Math.floor(data.length * 3 / 4) - (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);
var sniffImageType = (bytes) => {
  const ascii = (start, end) => String.fromCharCode(...bytes.subarray(start, end));
  if (bytes[0] === 137 && ascii(1, 4) === "PNG")
    return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return "image/jpeg";
  }
  if (ascii(0, 4) === "GIF8")
    return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP")
    return "image/webp";
  return null;
};
var sniffBase64 = (data) => sniffImageType(new Uint8Array(Buffer.from(data.slice(0, 24), "base64")));
var refuse = (code, error) => ({
  ok: false,
  code,
  error
});
var size = (bytes) => bytes >= 1e6 ? `${Math.round(bytes / 1e5) / 10} MB` : `${Math.round(bytes / 1000)} KB`;
var cleanFileName = (name) => {
  const base = typeof name === "string" ? (name.split(/[\\/]/).pop() ?? "").replace(/[\u0000-\u001f\u007f<>"]/g, "").trim() : "";
  return base.slice(0, 120) || "attachment";
};
var parseImages = (input, limits = {}) => {
  const { maxImages, maxImageBytes } = {
    ...DEFAULT_ATTACHMENT_LIMITS,
    ...limits
  };
  if (input === undefined || input === null)
    return { ok: true, images: [] };
  if (!Array.isArray(input)) {
    return refuse("invalid_images", "Attached images couldn't be read.");
  }
  if (input.length > maxImages) {
    return refuse("too_many_images", `Attach up to ${maxImages} images to one message.`);
  }
  const images = [];
  for (const item of input) {
    const { mediaType, data, name } = item ?? {};
    if (typeof data !== "string" || !data || !BASE64.test(data)) {
      return refuse("invalid_images", "Attached images couldn't be read.");
    }
    if (decodedLength(data) > maxImageBytes) {
      return refuse("image_too_large", `Each image can be up to ${size(maxImageBytes)}. Try a smaller screenshot.`);
    }
    const actual = sniffBase64(data);
    if (!actual || actual !== mediaType) {
      return refuse("unsupported_image", "Attach PNG, JPEG, WebP, or GIF images.");
    }
    images.push({
      mediaType: actual,
      data,
      ...typeof name === "string" && name.trim() && { name: cleanFileName(name) }
    });
  }
  return { ok: true, images };
};
var UNSUPPORTED_FILE = "Attach PDF, plain text, Markdown, or CSV files, or PNG, JPEG, WebP, or GIF images.";
var UNREADABLE_FILE = "That file isn't a readable PDF or text file.";
var isDocumentType = (type) => typeof type === "string" && DOCUMENT_TYPES.includes(type);
var isReadableText = (bytes) => {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return false;
  }
  if (text.includes("\x00"))
    return false;
  let control = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code < 32 && ![9, 10, 12, 13].includes(code) || code === 127) {
      control++;
    }
  }
  return control <= Math.max(2, text.length / 1000);
};
var parseDocuments = (input, imageCount = 0, limits = {}) => {
  const { maxAttachments, maxPdfBytes, maxTextFileBytes } = {
    ...DEFAULT_ATTACHMENT_LIMITS,
    ...limits
  };
  if (input === undefined || input === null) {
    return { ok: true, documents: [] };
  }
  if (!Array.isArray(input)) {
    return refuse("invalid_files", UNREADABLE_FILE);
  }
  if (input.length + imageCount > maxAttachments) {
    return refuse("too_many_files", `Attach up to ${maxAttachments} files to one message.`);
  }
  const documents = [];
  for (const item of input) {
    const { mediaType, name, data } = item ?? {};
    if (typeof data !== "string" || !data || !BASE64.test(data)) {
      return refuse("invalid_files", UNREADABLE_FILE);
    }
    if (!isDocumentType(mediaType)) {
      return refuse("unsupported_file", UNSUPPORTED_FILE);
    }
    const isPdf = mediaType === "application/pdf";
    if (decodedLength(data) > (isPdf ? maxPdfBytes : maxTextFileBytes)) {
      return refuse("file_too_large", isPdf ? `Each PDF can be up to ${size(maxPdfBytes)}.` : `Each text, Markdown, or CSV file can be up to ${size(maxTextFileBytes)}.`);
    }
    const bytes = new Uint8Array(Buffer.from(data, "base64"));
    const readable = isPdf ? String.fromCharCode(...bytes.subarray(0, 5)) === "%PDF-" : isReadableText(bytes);
    if (!readable) {
      return refuse("unsupported_file", UNREADABLE_FILE);
    }
    documents.push({ mediaType, name: cleanFileName(name), data });
  }
  return { ok: true, documents };
};

// src/attachments/pdf.ts
var MAX_PDF_PAGES = 30;
var READ_TIMEOUT_MS = 15000;

class PdfTooLongError extends Error {
  constructor(pages) {
    super(`pdf has ${pages} pages`);
    this.name = "PdfTooLongError";
  }
}
var readPdfText = async (bytes, maxPages = MAX_PDF_PAGES) => {
  const read = async () => {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes, { disableFontFace: true });
    try {
      if (pdf.numPages > maxPages)
        throw new PdfTooLongError(pdf.numPages);
      const { totalPages, text } = await extractText(pdf, { mergePages: true });
      return { pages: totalPages, text };
    } finally {
      await pdf.loadingTask.destroy();
    }
  };
  let timer;
  try {
    return await Promise.race([
      read(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("pdf read timed out")), READ_TIMEOUT_MS);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
};

// src/attachments/documents.ts
var KINDS = {
  "application/pdf": "PDF",
  "text/plain": "text",
  "text/markdown": "Markdown",
  "text/csv": "CSV"
};
var readDocuments = async (documents, options = {}) => {
  const { maxDocumentChars, maxPdfPages } = {
    ...DEFAULT_ATTACHMENT_LIMITS,
    ...options.limits
  };
  const readPdf = options.readPdf ?? ((bytes) => readPdfText(bytes, maxPdfPages));
  const read = [];
  for (const document of documents) {
    const bytes = Buffer.from(document.data, "base64");
    let text;
    if (document.mediaType === "application/pdf") {
      try {
        text = (await readPdf(new Uint8Array(bytes))).text;
      } catch (error) {
        return error instanceof PdfTooLongError ? {
          ok: false,
          code: "pdf_too_long",
          error: `Each PDF can be up to ${maxPdfPages} pages.`
        } : { ok: false, code: "unreadable_file", error: UNREADABLE_FILE };
      }
      if (!text.trim()) {
        return {
          ok: false,
          code: "pdf_has_no_text",
          error: `That PDF has no text ${options.productName ? `${options.productName} can read` : "that can be read"} (it may be a scan). Attach a screenshot of it instead.`
        };
      }
    } else {
      text = new TextDecoder("utf-8").decode(bytes);
    }
    const clean = text.replace(/\r\n?/g, `
`).replace(/\n{3,}/g, `

`).trim();
    read.push({
      name: document.name,
      kind: KINDS[document.mediaType],
      text: clean.slice(0, maxDocumentChars),
      truncated: clean.length > maxDocumentChars
    });
  }
  return { ok: true, documents: read };
};
var attachedFileBlocks = (documents) => documents.map((document) => `<attached_file name="${document.name.replaceAll('"', "")}" type="${document.kind}"${document.truncated ? ' truncated="true"' : ""}>
${document.text.replaceAll("</attached_file>", "")}
</attached_file>`);
// src/attachments/metadata.ts
var be16 = (b, i) => (b[i] ?? 0) << 8 | (b[i + 1] ?? 0);
var le16 = (b, i) => (b[i] ?? 0) | (b[i + 1] ?? 0) << 8;
var be32 = (b, i) => (be16(b, i) << 16 >>> 0) + be16(b, i + 2);
var le32 = (b, i) => le16(b, i) + (le16(b, i + 2) << 16 >>> 0);
var le24 = (b, i) => le16(b, i) + ((b[i + 2] ?? 0) << 16);
var ascii = (b, start, end) => String.fromCharCode(...b.subarray(start, end));
var isStandalone = (marker) => marker === 1 || marker >= 208 && marker <= 216;
var isStartOfFrame = (marker) => marker >= 192 && marker <= 207 && marker !== 196 && marker !== 200 && marker !== 204;
var exifOrientation = (data) => {
  if (ascii(data, 0, 6) !== "Exif\x00\x00")
    return null;
  const tiff = data.subarray(6);
  const little = ascii(tiff, 0, 2) === "II";
  const u16 = (i) => little ? le16(tiff, i) : be16(tiff, i);
  const u32 = (i) => little ? le32(tiff, i) : be32(tiff, i);
  const ifd = u32(4);
  const count = u16(ifd);
  for (let n = 0;n < count; n++) {
    const entry = ifd + 2 + n * 12;
    if (entry + 12 > tiff.length)
      return null;
    if (u16(entry) === 274) {
      const value = u16(entry + 8);
      return value >= 1 && value <= 8 ? value : null;
    }
  }
  return null;
};
var orientationSegment = (orientation) => Uint8Array.from([
  255,
  225,
  0,
  34,
  69,
  120,
  105,
  102,
  0,
  0,
  77,
  77,
  0,
  42,
  0,
  0,
  0,
  8,
  0,
  1,
  1,
  18,
  0,
  3,
  0,
  0,
  0,
  1,
  0,
  orientation,
  0,
  0,
  0,
  0,
  0,
  0
]);
var concat = (parts) => {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};
var stripJpeg = (bytes) => {
  const kept = [bytes.subarray(0, 2)];
  let orientation = null;
  let afterApp0 = 1;
  let i = 2;
  while (i + 4 <= bytes.length && bytes[i] === 255) {
    const marker = bytes[i + 1] ?? 0;
    if (marker === 255) {
      i++;
      continue;
    }
    if (isStandalone(marker)) {
      kept.push(bytes.subarray(i, i + 2));
      i += 2;
      continue;
    }
    const length = be16(bytes, i + 2);
    const end = i + 2 + length;
    if (length < 2 || end > bytes.length)
      break;
    if (marker === 218) {
      kept.push(bytes.subarray(i));
      i = bytes.length;
      break;
    }
    const segment = bytes.subarray(i, end);
    const isApp = marker >= 224 && marker <= 239;
    if (marker === 225) {
      orientation ??= exifOrientation(bytes.subarray(i + 4, end));
    } else if (!isApp && marker !== 254) {
      kept.push(segment);
    } else if (marker === 224 || marker === 226 || marker === 238) {
      kept.push(segment);
      if (marker === 224)
        afterApp0 = kept.length;
    }
    i = end;
  }
  if (i < bytes.length)
    return bytes;
  if (orientation && orientation !== 1) {
    kept.splice(afterApp0, 0, orientationSegment(orientation));
  }
  return concat(kept);
};
var PNG_METADATA = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);
var stripPng = (bytes) => {
  const kept = [bytes.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= bytes.length) {
    const length = be32(bytes, i);
    const type = ascii(bytes, i + 4, i + 8);
    const end = i + 12 + length;
    if (end > bytes.length)
      return bytes;
    if (!PNG_METADATA.has(type))
      kept.push(bytes.subarray(i, end));
    i = end;
    if (type === "IEND")
      break;
  }
  return concat(kept);
};
var stripWebp = (bytes) => {
  const kept = [];
  let i = 12;
  let removed = false;
  while (i + 8 <= bytes.length) {
    const type = ascii(bytes, i, i + 4);
    const size = le32(bytes, i + 4);
    const end = i + 8 + size + size % 2;
    if (end > bytes.length + 1)
      return bytes;
    if (type === "EXIF" || type === "XMP ") {
      removed = true;
    } else if (type === "VP8X") {
      const chunk = bytes.slice(i, Math.min(end, bytes.length));
      chunk[8] = (chunk[8] ?? 0) & ~12;
      kept.push(chunk);
    } else {
      kept.push(bytes.subarray(i, Math.min(end, bytes.length)));
    }
    i = end;
  }
  if (!removed)
    return bytes;
  const body = concat(kept);
  const header = bytes.slice(0, 12);
  const size = body.length + 4;
  header[4] = size & 255;
  header[5] = size >> 8 & 255;
  header[6] = size >> 16 & 255;
  header[7] = size >> 24 & 255;
  return concat([header, body]);
};
var stripImageMetadata = (bytes, mediaType) => {
  switch (mediaType) {
    case "image/jpeg":
      return stripJpeg(bytes);
    case "image/png":
      return stripPng(bytes);
    case "image/webp":
      return stripWebp(bytes);
    default:
      return bytes;
  }
};
var jpegSize = (bytes) => {
  let i = 2;
  let orientation = 1;
  while (i + 9 <= bytes.length && bytes[i] === 255) {
    const marker = bytes[i + 1] ?? 0;
    if (marker === 255) {
      i++;
      continue;
    }
    if (isStandalone(marker)) {
      i += 2;
      continue;
    }
    const length = be16(bytes, i + 2);
    if (marker === 225) {
      orientation = exifOrientation(bytes.subarray(i + 4, i + 2 + length)) ?? orientation;
    }
    if (isStartOfFrame(marker)) {
      const height = be16(bytes, i + 5);
      const width = be16(bytes, i + 7);
      return orientation >= 5 ? { width: height, height: width } : { width, height };
    }
    if (marker === 218 || length < 2)
      return null;
    i += 2 + length;
  }
  return null;
};
var webpSize = (bytes) => {
  const type = ascii(bytes, 12, 16);
  if (type === "VP8X") {
    return { width: le24(bytes, 24) + 1, height: le24(bytes, 27) + 1 };
  }
  if (type === "VP8 ") {
    return {
      width: le16(bytes, 26) & 16383,
      height: le16(bytes, 28) & 16383
    };
  }
  if (type === "VP8L") {
    const bits = le32(bytes, 21);
    return { width: (bits & 16383) + 1, height: (bits >> 14 & 16383) + 1 };
  }
  return null;
};
var imageSize = (bytes, mediaType) => {
  const size = mediaType === "image/png" ? { width: be32(bytes, 16), height: be32(bytes, 20) } : mediaType === "image/gif" ? { width: le16(bytes, 6), height: le16(bytes, 8) } : mediaType === "image/jpeg" ? jpegSize(bytes) : webpSize(bytes);
  return size && size.width > 0 && size.height > 0 ? size : null;
};
// src/attachments/screening.ts
var ATTEMPT_TIMEOUT_MS = 20000;
var ATTEMPTS = 2;
var VERDICTS = new Set(["allow", "block", "review"]);
var UNAVAILABLE = {
  approved: false,
  verdict: "unavailable",
  categories: []
};
var isSeeLessConfigured = (config) => Boolean(config.url && config.apiKey);
var checkImage = async (bytes, mimeType, config) => {
  if (!isSeeLessConfigured(config))
    return UNAVAILABLE;
  const endpoint = `${config.url?.replace(/\/+$/, "")}/v1/moderate/image`;
  const doFetch = config.fetchImpl ?? fetch;
  for (let attempt = 1;attempt <= ATTEMPTS; attempt += 1) {
    const body = new FormData;
    body.append("file", new Blob([bytes], { type: mimeType }));
    try {
      const res = await doFetch(endpoint, {
        method: "POST",
        headers: { "x-api-key": config.apiKey ?? "" },
        body,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS)
      });
      if (res.status >= 500 && attempt < ATTEMPTS)
        continue;
      if (!res.ok) {
        console.error(`[imageModeration] See Less API error: ${res.status}`);
        return UNAVAILABLE;
      }
      const parsed = await res.json();
      const verdict = parsed.verdict ?? "";
      if (!VERDICTS.has(verdict)) {
        console.error(`[imageModeration] unrecognised See Less verdict: ${verdict}`);
        return UNAVAILABLE;
      }
      const categories = (parsed.categories ?? []).map((entry) => entry.category).filter((category) => Boolean(category));
      return {
        approved: verdict === "allow",
        verdict,
        categories,
        caseId: parsed.case_id
      };
    } catch (err) {
      if (attempt < ATTEMPTS)
        continue;
      console.error("[imageModeration] See Less unreachable:", err);
      return UNAVAILABLE;
    }
  }
  return UNAVAILABLE;
};
var REFUSED = {
  ok: false,
  status: 422,
  code: "image_refused",
  error: "One of the attached images can't be used. Remove it and try again. Nothing was charged."
};
var UNAVAILABLE_REFUSAL = {
  ok: false,
  status: 503,
  code: "image_check_unavailable",
  error: "Attached images can't be checked right now. Try again in a moment, or send without them. Nothing was charged."
};
var screenImages = async (images, options) => {
  if (!images.length)
    return { ok: true };
  const { config, production } = options;
  if (!isSeeLessConfigured(config)) {
    if (!production)
      return { ok: true };
    console.error("[imageModeration] SEE_LESS_URL/SEE_LESS_API_KEY not set in production; refusing attached images");
    return UNAVAILABLE_REFUSAL;
  }
  const results = await Promise.all(images.map((image) => checkImage(new Uint8Array(Buffer.from(image.data, "base64")), image.mediaType, config)));
  const refused = results.find((result) => !result.approved);
  if (!refused)
    return { ok: true };
  console.warn(`[imageModeration] attached image refused${options.context ? `: ${options.context}` : ""} verdict=${refused.verdict}` + (refused.categories.length ? ` categories=${refused.categories.join(",")}` : "") + (refused.caseId ? ` caseId=${refused.caseId}` : ""));
  return refused.verdict === "unavailable" ? UNAVAILABLE_REFUSAL : REFUSED;
};

// src/attachments/prepare.ts
var prepareAttachments = async (input, options) => {
  const images = parseImages(input.images, options.limits);
  if (!images.ok)
    return { ...images, status: 400 };
  const files = parseDocuments(input.files, images.images.length, options.limits);
  if (!files.ok)
    return { ...files, status: 400 };
  const screening = await screenImages(images.images, {
    config: options.seeLess,
    production: options.production,
    context: options.context
  });
  if (!screening.ok)
    return screening;
  const documents = await readDocuments(files.documents, {
    limits: options.limits,
    productName: options.productName,
    readPdf: options.readPdf
  });
  if (!documents.ok)
    return { ...documents, status: 422 };
  return {
    ok: true,
    images: images.images.map((image) => ({
      ...image,
      data: Buffer.from(stripImageMetadata(new Uint8Array(Buffer.from(image.data, "base64")), image.mediaType)).toString("base64")
    })),
    documents: documents.documents
  };
};
export {
  DEFAULT_ATTACHMENT_LIMITS,
  DOCUMENT_TYPES,
  IMAGE_TYPES,
  MAX_PDF_PAGES,
  PdfTooLongError,
  attachedFileBlocks,
  checkImage,
  cleanFileName,
  decodedLength,
  imageSize,
  isReadableText,
  isSeeLessConfigured,
  parseDocuments,
  parseImages,
  prepareAttachments,
  readDocuments,
  readPdfText,
  screenImages,
  sniffImageType,
  stripImageMetadata
};

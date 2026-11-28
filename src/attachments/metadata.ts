import type { ImageType } from "./types";

/**
 * Image metadata removal and size reading, done on the bytes alone (no image
 * library), so a photo's location, camera, and capture time never travel
 * further than the upload
 */

const be16 = (b: Uint8Array, i: number) => ((b[i] ?? 0) << 8) | (b[i + 1] ?? 0);
const le16 = (b: Uint8Array, i: number) => (b[i] ?? 0) | ((b[i + 1] ?? 0) << 8);
const be32 = (b: Uint8Array, i: number) =>
  ((be16(b, i) << 16) >>> 0) + be16(b, i + 2);
const le32 = (b: Uint8Array, i: number) =>
  le16(b, i) + ((le16(b, i + 2) << 16) >>> 0);
const le24 = (b: Uint8Array, i: number) => le16(b, i) + ((b[i + 2] ?? 0) << 16);
const ascii = (b: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...b.subarray(start, end));

/** JPEG markers that stand alone, with no length after them */
const isStandalone = (marker: number) =>
  marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8);

/** JPEG start-of-frame markers, which carry the image size */
const isStartOfFrame = (marker: number) =>
  marker >= 0xc0 &&
  marker <= 0xcf &&
  marker !== 0xc4 &&
  marker !== 0xc8 &&
  marker !== 0xcc;

/** The EXIF orientation (1 to 8) an APP1 segment's data holds, if any */
const exifOrientation = (data: Uint8Array): number | null => {
  if (ascii(data, 0, 6) !== "Exif\0\0") return null;

  const tiff = data.subarray(6);
  const little = ascii(tiff, 0, 2) === "II";
  const u16 = (i: number) => (little ? le16(tiff, i) : be16(tiff, i));
  const u32 = (i: number) => (little ? le32(tiff, i) : be32(tiff, i));
  const ifd = u32(4);
  const count = u16(ifd);

  for (let n = 0; n < count; n++) {
    const entry = ifd + 2 + n * 12;

    if (entry + 12 > tiff.length) return null;

    if (u16(entry) === 0x0112) {
      const value = u16(entry + 8);

      return value >= 1 && value <= 8 ? value : null;
    }
  }

  return null;
};

/** A minimal APP1 segment carrying only an EXIF orientation */
const orientationSegment = (orientation: number): Uint8Array =>
  Uint8Array.from([
    0xff,
    0xe1,
    0x00,
    0x22,
    // "Exif\0\0"
    0x45,
    0x78,
    0x69,
    0x66,
    0x00,
    0x00,
    // big-endian TIFF header, first IFD at 8
    0x4d,
    0x4d,
    0x00,
    0x2a,
    0x00,
    0x00,
    0x00,
    0x08,
    // one entry: orientation, SHORT, count 1, value
    0x00,
    0x01,
    0x01,
    0x12,
    0x00,
    0x03,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    orientation,
    0x00,
    0x00,
    // no next IFD
    0x00,
    0x00,
    0x00,
    0x00,
  ]);

const concat = (parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;

  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }

  return out;
};

/**
 * A JPEG without its metadata segments: EXIF and XMP (APP1), Photoshop and
 * IPTC (APP13), comments, and the other application segments, which carry a
 * photo's location, camera, and capture time. Kept: JFIF (APP0), the color
 * profile (APP2), Adobe color info (APP14), and the image itself. A rotated
 * photo keeps only its orientation, so it still displays upright
 */
const stripJpeg = (bytes: Uint8Array): Uint8Array => {
  const kept: Uint8Array[] = [bytes.subarray(0, 2)];
  let orientation: number | null = null;
  let afterApp0 = 1;
  let i = 2;

  while (i + 4 <= bytes.length && bytes[i] === 0xff) {
    const marker = bytes[i + 1] ?? 0;

    if (marker === 0xff) {
      // fill byte before a marker
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

    if (length < 2 || end > bytes.length) break;

    // Start of scan: the compressed image follows, kept as it is
    if (marker === 0xda) {
      kept.push(bytes.subarray(i));

      i = bytes.length;
      break;
    }

    const segment = bytes.subarray(i, end);
    const isApp = marker >= 0xe0 && marker <= 0xef;

    if (marker === 0xe1) {
      orientation ??= exifOrientation(bytes.subarray(i + 4, end));
    } else if (!isApp && marker !== 0xfe) {
      kept.push(segment);
    } else if (marker === 0xe0 || marker === 0xe2 || marker === 0xee) {
      kept.push(segment);

      if (marker === 0xe0) afterApp0 = kept.length;
    }

    i = end;
  }

  // An unreadable layout is kept whole rather than corrupted
  if (i < bytes.length) return bytes;

  if (orientation && orientation !== 1) {
    kept.splice(afterApp0, 0, orientationSegment(orientation));
  }

  return concat(kept);
};

/** PNG chunks that hold text, EXIF, or a timestamp rather than the image */
const PNG_METADATA = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);

/** A PNG without its text, EXIF, and timestamp chunks */
const stripPng = (bytes: Uint8Array): Uint8Array => {
  const kept: Uint8Array[] = [bytes.subarray(0, 8)];
  let i = 8;

  while (i + 12 <= bytes.length) {
    const length = be32(bytes, i);
    const type = ascii(bytes, i + 4, i + 8);
    const end = i + 12 + length;

    if (end > bytes.length) return bytes;

    if (!PNG_METADATA.has(type)) kept.push(bytes.subarray(i, end));

    i = end;

    if (type === "IEND") break;
  }

  return concat(kept);
};

/** A WebP without its EXIF and XMP chunks (and their flags cleared) */
const stripWebp = (bytes: Uint8Array): Uint8Array => {
  const kept: Uint8Array[] = [];
  let i = 12;
  let removed = false;

  while (i + 8 <= bytes.length) {
    const type = ascii(bytes, i, i + 4);
    const size = le32(bytes, i + 4);
    const end = i + 8 + size + (size % 2);

    if (end > bytes.length + 1) return bytes;

    if (type === "EXIF" || type === "XMP ") {
      removed = true;
    } else if (type === "VP8X") {
      const chunk = bytes.slice(i, Math.min(end, bytes.length));

      // flags: bit 3 is EXIF, bit 2 is XMP
      chunk[8] = (chunk[8] ?? 0) & ~0x0c;
      kept.push(chunk);
    } else {
      kept.push(bytes.subarray(i, Math.min(end, bytes.length)));
    }

    i = end;
  }

  if (!removed) return bytes;

  const body = concat(kept);
  const header = bytes.slice(0, 12);
  const size = body.length + 4;

  header[4] = size & 0xff;
  header[5] = (size >> 8) & 0xff;
  header[6] = (size >> 16) & 0xff;
  header[7] = (size >> 24) & 0xff;

  return concat([header, body]);
};

/**
 * The image without the metadata it carries (a photo's location, camera,
 * and capture time, embedded text), so none of it is stored or published.
 * The image itself is untouched. A GIF is kept as it is: it carries no such
 * metadata in practice
 * @param bytes - The image, already checked to be `mediaType`.
 * @param mediaType - The image's type.
 * @returns The image without its metadata.
 */
export const stripImageMetadata = (
  bytes: Uint8Array,
  mediaType: ImageType,
): Uint8Array => {
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

/** An image's displayed size in pixels */
export interface ImageSize {
  width: number;
  height: number;
}

const jpegSize = (bytes: Uint8Array): ImageSize | null => {
  let i = 2;
  let orientation = 1;

  while (i + 9 <= bytes.length && bytes[i] === 0xff) {
    const marker = bytes[i + 1] ?? 0;

    if (marker === 0xff) {
      i++;
      continue;
    }

    if (isStandalone(marker)) {
      i += 2;
      continue;
    }

    const length = be16(bytes, i + 2);

    if (marker === 0xe1) {
      orientation =
        exifOrientation(bytes.subarray(i + 4, i + 2 + length)) ?? orientation;
    }

    if (isStartOfFrame(marker)) {
      const height = be16(bytes, i + 5);
      const width = be16(bytes, i + 7);

      // orientations 5 to 8 turn the image a quarter, swapping its sides
      return orientation >= 5
        ? { width: height, height: width }
        : { width, height };
    }

    if (marker === 0xda || length < 2) return null;

    i += 2 + length;
  }

  return null;
};

const webpSize = (bytes: Uint8Array): ImageSize | null => {
  const type = ascii(bytes, 12, 16);

  if (type === "VP8X") {
    return { width: le24(bytes, 24) + 1, height: le24(bytes, 27) + 1 };
  }

  if (type === "VP8 ") {
    return {
      width: le16(bytes, 26) & 0x3fff,
      height: le16(bytes, 28) & 0x3fff,
    };
  }

  if (type === "VP8L") {
    const bits = le32(bytes, 21);

    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }

  return null;
};

/**
 * An image's displayed size, read from its header, or null when it can't be
 * read. A JPEG's EXIF orientation is applied
 */
export const imageSize = (
  bytes: Uint8Array,
  mediaType: ImageType,
): ImageSize | null => {
  const size =
    mediaType === "image/png"
      ? { width: be32(bytes, 16), height: be32(bytes, 20) }
      : mediaType === "image/gif"
        ? { width: le16(bytes, 6), height: le16(bytes, 8) }
        : mediaType === "image/jpeg"
          ? jpegSize(bytes)
          : webpSize(bytes);

  return size && size.width > 0 && size.height > 0 ? size : null;
};

import { describe, expect, it } from "bun:test";

import { imageSize, stripImageMetadata } from "./metadata";

/** An 8x6 JPEG with no metadata: SOI, JFIF, tables, frame, scan, EOI */
const JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAAGAAgDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAVAQEBAAAAAAAAAAAAAAAAAAAHCf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ADoDFU3/2Q==",
  "base64",
);

/** A 3x2 PNG carrying a comment and date text chunks and a timestamp */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAMAAAACAQMAAACnuvRZAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAADUExURQCAAJz5pZEAAAAHdElNRQfqCxwRCSIPUniYAAAAFXRFWHRjb21tZW50AFRha2VuIGF0IGhvbWVS1XQkAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDI2LTExLTI4VDE3OjA5OjM0KzAwOjAwDW5n8AAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyNi0xMS0yOFQxNzowOTozNCswMDowMHwz30wAAAAodEVYdGRhdGU6dGltZXN0YW1wADIwMjYtMTEtMjhUMTc6MDk6MzQrMDA6MDArJv6TAAAADElEQVQI12NgYGAAAAAEAAEnNCcKAAAAAElFTkSuQmCC",
  "base64",
);

/**
 * An EXIF APP1 segment, big-endian, with an orientation and an artist (a
 * stand-in for the location and camera details a phone photo carries)
 */
const exifSegment = (orientation: number, artist: string): Buffer => {
  const text = Buffer.from(`${artist}\0`, "latin1");
  // header (8) + count (2) + two entries (24) + next IFD (4)
  const textOffset = 8 + 2 + 24 + 4;
  const tiff = Buffer.alloc(textOffset + text.length);

  tiff.write("MM", 0, "latin1");
  tiff.writeUInt16BE(42, 2);
  tiff.writeUInt32BE(8, 4);
  tiff.writeUInt16BE(2, 8);
  // Artist, ASCII
  tiff.writeUInt16BE(0x013b, 10);
  tiff.writeUInt16BE(2, 12);
  tiff.writeUInt32BE(text.length, 14);
  tiff.writeUInt32BE(textOffset, 18);
  // Orientation, SHORT
  tiff.writeUInt16BE(0x0112, 22);
  tiff.writeUInt16BE(3, 24);
  tiff.writeUInt32BE(1, 26);
  tiff.writeUInt16BE(orientation, 30);
  text.copy(tiff, textOffset);

  const data = Buffer.concat([Buffer.from("Exif\0\0", "latin1"), tiff]);
  const header = Buffer.alloc(4);

  header.writeUInt16BE(0xffe1, 0);
  header.writeUInt16BE(data.length + 2, 2);

  return Buffer.concat([header, data]);
};

/** A JPEG with an EXIF segment and a comment after its JFIF segment */
const photo = (orientation: number) => {
  const comment = Buffer.concat([
    Buffer.from([0xff, 0xfe, 0x00, 0x0f]),
    Buffer.from("Taken at home", "latin1"),
  ]);

  // SOI (2) + APP0 (2 + 16)
  return Buffer.concat([
    JPEG.subarray(0, 20),
    exifSegment(orientation, "Jane Doe"),
    comment,
    JPEG.subarray(20),
  ]);
};

const has = (bytes: Uint8Array, text: string) =>
  Buffer.from(bytes).includes(Buffer.from(text, "latin1"));

describe("stripImageMetadata", () => {
  it("removes a JPEG's EXIF and comments, keeping the image", () => {
    const input = photo(1);
    const out = stripImageMetadata(input, "image/jpeg");

    expect(has(input, "Jane Doe")).toBe(true);
    expect(has(out, "Jane Doe")).toBe(false);
    expect(has(out, "Taken at home")).toBe(false);
    expect(has(out, "Exif")).toBe(false);
    expect(Buffer.from(out).equals(JPEG)).toBe(true);
  });

  it("keeps only the orientation of a rotated photo, right after JFIF", () => {
    const out = stripImageMetadata(photo(6), "image/jpeg");

    expect(has(out, "Jane Doe")).toBe(false);
    expect(has(out, "Exif")).toBe(true);
    expect(Buffer.from(out).subarray(20, 22)).toEqual(
      Buffer.from([0xff, 0xe1]),
    );
    // read back as a rotated image: its sides swap
    expect(imageSize(out, "image/jpeg")).toEqual({ width: 6, height: 8 });
  });

  it("removes a PNG's text and timestamp chunks", () => {
    const out = stripImageMetadata(PNG, "image/png");

    expect(has(PNG, "Taken at home")).toBe(true);
    expect(has(out, "Taken at home")).toBe(false);
    expect(has(out, "tEXt")).toBe(false);
    expect(has(out, "tIME")).toBe(false);
    expect(has(out, "IDAT")).toBe(true);
    expect(has(out, "IEND")).toBe(true);
    expect(imageSize(out, "image/png")).toEqual({ width: 3, height: 2 });
  });

  it("removes a WebP's EXIF chunk and its flag", () => {
    const vp8x = Buffer.alloc(18);

    vp8x.write("VP8X", 0, "latin1");
    vp8x.writeUInt32LE(10, 4);
    vp8x[8] = 0x08;
    vp8x.writeUIntLE(99, 12, 3);
    vp8x.writeUIntLE(49, 15, 3);

    const exif = Buffer.concat([
      Buffer.from("EXIF", "latin1"),
      Buffer.from([8, 0, 0, 0]),
      Buffer.from("Jane Doe", "latin1"),
    ]);
    const body = Buffer.concat([Buffer.from("WEBP", "latin1"), vp8x, exif]);
    const webp = Buffer.concat([
      Buffer.from("RIFF", "latin1"),
      Buffer.from([body.length, 0, 0, 0]),
      body,
    ]);

    const out = stripImageMetadata(webp, "image/webp");

    expect(has(out, "Jane Doe")).toBe(false);
    expect(out[20]).toBe(0);
    expect(Buffer.from(out).readUInt32LE(4)).toBe(out.length - 8);
    expect(imageSize(out, "image/webp")).toEqual({ width: 100, height: 50 });
  });

  it("keeps a layout it can't read whole rather than breaking it", () => {
    const odd = Buffer.from([0xff, 0xd8, 0x00, 0x01, 0x02]);

    expect(stripImageMetadata(odd, "image/jpeg")).toBe(odd);
  });
});

describe("imageSize", () => {
  it("reads a JPEG's and a GIF's size", () => {
    expect(imageSize(JPEG, "image/jpeg")).toEqual({ width: 8, height: 6 });

    const gif = Buffer.from("GIF89a\x05\x00\x04\x00", "latin1");

    expect(imageSize(gif, "image/gif")).toEqual({ width: 5, height: 4 });
  });
});

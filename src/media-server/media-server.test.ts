import { describe, expect, it } from "bun:test";

import sharp from "sharp";

import { generateLqip } from "./index";

const PNG = await sharp({
  create: { width: 64, height: 48, channels: 3, background: "#e0533d" },
})
  .png()
  .toBuffer();

describe("generateLqip", () => {
  it("makes a small webp data URI from an image", async () => {
    const lqip = await generateLqip(PNG);

    expect(lqip).toStartWith("data:image/webp;base64,");
    expect((lqip ?? "").length).toBeLessThan(1000);
  });

  it("is null for bytes that are not an image", async () => {
    expect(await generateLqip(Buffer.from("not an image"))).toBeNull();
  });
});

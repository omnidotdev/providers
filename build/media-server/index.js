// src/media-server/index.ts
var LQIP_WIDTH = 16;
var generateLqip = async (input, { width = LQIP_WIDTH, quality = 30 } = {}) => {
  try {
    const { default: sharp } = await import("sharp");
    const buffer = await sharp(input).rotate().resize(width).webp({ quality }).toBuffer();
    return `data:image/webp;base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.warn("generateLqip: no placeholder made:", error instanceof Error ? error.message : String(error));
    return null;
  }
};
export {
  generateLqip
};

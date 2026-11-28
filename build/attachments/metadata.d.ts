import type { ImageType } from "./types";
/**
 * The image without the metadata it carries (a photo's location, camera,
 * and capture time, embedded text), so none of it is stored or published.
 * The image itself is untouched. A GIF is kept as it is: it carries no such
 * metadata in practice
 * @param bytes - The image, already checked to be `mediaType`.
 * @param mediaType - The image's type.
 * @returns The image without its metadata.
 */
export declare const stripImageMetadata: (bytes: Uint8Array, mediaType: ImageType) => Uint8Array;
/** An image's displayed size in pixels */
export interface ImageSize {
    width: number;
    height: number;
}
/**
 * An image's displayed size, read from its header, or null when it can't be
 * read. A JPEG's EXIF orientation is applied
 */
export declare const imageSize: (bytes: Uint8Array, mediaType: ImageType) => ImageSize | null;

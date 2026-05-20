/**
 * Normalized image file shape used by the SKU image pipeline.
 * Matches multer's `Express.Multer.File` for the three fields the pipeline reads.
 *
 * @typedef {object} ImageFile
 * @property {Buffer<ArrayBufferLike>} buffer - Generic param required for @types/node v22+ compat (covers both NonSharedBuffer and shared).
 * @property {string} mimetype     - MIME type (e.g. `image/jpeg`).
 * @property {string} originalname - Original filename; used to derive zoom extension.
 */

/**
 * @typedef {object} ProcessedImageResult
 * @property {string} mainKey     - Storage key for the 1000px WebP variant.
 * @property {string} thumbKey    - Storage key for the 450px WebP variant.
 * @property {string} zoomKey     - Storage key for the original-format full-res variant.
 * @property {number} mainSizeKb  - Encoded size of the main variant, in KB.
 * @property {number} thumbSizeKb - Encoded size of the thumb variant, in KB.
 * @property {number} zoomSizeKb  - Size of the original buffer, in KB.
 * @property {string} ext         - Lowercase extension of the original file (no leading dot).
 */

/**
 * @typedef {Object} SafeSkuImage
 * @property {string|null} [imageUrl]
 * @property {string|null} [imageType]
 * @property {string|null} [altText]
 * @property {boolean|null} [isPrimary]
 */

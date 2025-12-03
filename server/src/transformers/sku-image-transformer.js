const { getFullName } = require('../utils/name-utils');

/**
 * @function
 * @description
 * Transforms a DB record from `sku_images` into a clean API response object.
 *
 * @param {Object} record - Row fetched from DB (snake_case keys).
 * @returns {Object} API-friendly object (camelCase, filtered fields).
 */
const transformSkuImageRow = (record) => ({
  id: record.id,
  skuId: record.sku_id ?? record.skuId,
  imageUrl: record.image_url ?? record.imageUrl,
  imageType: record.image_type ?? record.imageType,
  displayOrder: record.display_order ?? record.displayOrder,
  isPrimary: record.is_primary ?? record.isPrimary,
});

/**
 * @function
 * @description
 * Transforms an array of DB records from `sku_images` into an array of
 * API-friendly objects with camelCase keys and filtered fields.
 *
 * @param {Object[]} records - Array of DB rows (snake_case keys).
 * @returns {Object[]} Transformed API-friendly image objects.
 */
const transformSkuImageResults = (records = []) =>
  Array.isArray(records)
    ? records.map((record) => transformSkuImageRow(record))
    : [];

/**
 * @typedef {Object} SlicedSkuImage
 * @description
 * Result from sliceSkuImagesForUser(). All fields are already
 * permission-filtered and safe for transformation.
 *
 * @property {string} id
 * @property {string} imageUrl                - Public URL of the image
 * @property {string} type                    - Image type (e.g., "main", "thumbnail")
 * @property {boolean} isPrimary              - Whether image is primary
 * @property {string} altText                 - Accessible alt text
 * @property {Object} [metadata]              - Optional metadata
 * @property {number} metadata.sizeKb         - File size in KB
 * @property {string} metadata.format         - Image format (jpg/png/webp)
 * @property {number} metadata.displayOrder   - Sort order
 * @property {Object} [audit]                 - Optional audit info
 * @property {string|Date} audit.uploadedAt   - Upload timestamp
 * @property {string} audit.uploadedBy.id      - User UUID
 * @property {string} audit.uploadedBy.firstname - Uploader first name
 * @property {string} audit.uploadedBy.lastname  - Uploader last name
 */

/**
 * @typedef {Object} SkuDetailImage
 * @description
 * Final normalized DTO returned in the SKU Detail API.
 *
 * @property {string} imageUrl
 * @property {string} type
 * @property {boolean} isPrimary
 * @property {string} altText
 */

/**
 * Transform a single *sliced* SKU image record into an API-safe DTO.
 *
 * This function is a pure transformer. All permission-based filtering
 * MUST happen in sliceSkuImagesForUser() before this step.
 *
 * @param {SlicedSkuImage|null} row
 *        A single filtered image row produced by sliceSkuImagesForUser().
 *
 * @returns {SkuDetailImage|null}
 *        Fully normalized DTO for API responses.
 */
const transformSkuImage = (row) => {
  if (!row) return null;

  // --- Metadata block (optional) ---
  const metadata = row.metadata
    ? {
        sizeKb: row.metadata.sizeKb,
        format: row.metadata.format,
        displayOrder: row.metadata.displayOrder,
      }
    : undefined;

  // --- Audit block (optional) ---
  const audit = row.audit
    ? {
        uploadedAt: row.audit.uploadedAt,
        uploadedBy: row.audit.uploadedBy
          ? {
              id: row.audit.uploadedBy.id,
              name: getFullName(
                row.audit.uploadedBy.firstname,
                row.audit.uploadedBy.lastname
              ),
            }
          : null,
      }
    : undefined;

  // --- Final DTO ---
  return {
    id: row.id,
    imageUrl: row.imageUrl,
    type: row.type,
    isPrimary: row.isPrimary,
    altText: row.altText,
    metadata,
    audit,
  };
};

module.exports = {
  transformSkuImageResults,
  transformSkuImage,
};

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
  skuId: record.sku_id,
  imageUrl: record.image_url,
  imageType: record.image_type,
  displayOrder: record.display_order,
  fileSizeKb: record.file_size_kb,
  fileFormat: record.file_format,
  altText: record.alt_text,
  isPrimary: record.is_primary,
  groupId: record.group_id,
  uploadedAt: record.uploaded_at,
  uploadedBy: record.uploaded_by,
});

/**
 * @function
 *
 * @description
 * Transforms flat `sku_images` DB rows into grouped SKU image entities.
 *
 * Each image group represents a logical SKU image consisting of:
 *   • main variant
 *   • thumbnail variant
 *   • zoom variant
 *
 * The function:
 *   • Normalizes DB snake_case fields via transformSkuImageRow()
 *   • Groups rows by groupId
 *   • Aggregates image variants under a single logical entity
 *   • Preserves ordering and primary flag
 *
 * Output structure:
 * [
 *   {
 *     groupId: string,
 *     displayOrder: number,
 *     altText: string,
 *     uploadedAt: Date,
 *     uploadedBy: string,
 *     variants: {
 *       main?: { id, imageUrl, isPrimary, fileFormat, fileSizeKb },
 *       thumbnail?: { ... },
 *       zoom?: { ... }
 *     }
 *   }
 * ]
 *
 * @param {Array<Object>} records
 *   Raw DB rows from `sku_images` table (snake_case fields).
 *
 * @returns {Array<Object>}
 *   Grouped SKU image entities suitable for API responses.
 */
const transformGroupedSkuImages = (records = []) => {
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }
  
  const rows = records.map(transformSkuImageRow);
  const groups = {};
  
  for (const r of rows) {
    // Initialize group if first encounter
    if (!groups[r.groupId]) {
      groups[r.groupId] = {
        groupId: r.groupId,
        displayOrder: r.displayOrder,
        altText: r.altText,
        uploadedAt: r.uploadedAt,
        uploadedBy: r.uploadedBy,
        variants: {}
      };
    }
    
    // Attach variant under imageType key
    groups[r.groupId].variants[r.imageType] = {
      id: r.id,
      imageUrl: r.imageUrl,
      isPrimary: r.isPrimary,
      fileFormat: r.fileFormat,
      fileSizeKb: r.fileSizeKb
    };
  }
  
  return Object.values(groups);
};

/**
 * @typedef {Object} SlicedSkuImage
 * @description
 * Result from sliceSkuImagesForUser(). All fields are already
 * permission-filtered and safe for transformation.
 *
 * @property {string} id
 * @property {string} groupId                - Logical image group UUID
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
 * @typedef {Object} SkuImageVariant
 *
 * Represents a specific image variant inside a group
 * (e.g., main, thumbnail, zoom).
 *
 * @property {string} id
 * @property {string} imageUrl
 * @property {string} altText
 * @property {Object} [metadata]
 * @property {number} metadata.sizeKb
 * @property {string} metadata.format
 * @property {number} metadata.displayOrder
 */

/**
 * @typedef {Object} SkuImageGroup
 *
 * Final grouped image structure returned in SKU Detail API.
 * One logical image group may contain multiple size/type variants.
 *
 * @property {string} groupId
 * @property {boolean} isPrimary
 * @property {Object<string, SkuImageVariant>} variants
 *           Keyed by image type ("main", "thumbnail", "zoom")
 * @property {Object} [audit]
 * @property {string|Date} audit.uploadedAt
 * @property {Object|null} audit.uploadedBy
 */

/**
 * Groups flat, permission-filtered SKU image rows into
 * structured image groups for the SKU Detail API.
 *
 * Each group represents one logical image and may contain
 * multiple variants (main, thumbnail, zoom).
 *
 * This function:
 *   • Performs no permission checks (handled upstream)
 *   • Performs no database access
 *   • Is a pure structural transformer
 *
 * @param {SlicedSkuImage[]} rows
 *        Flat array of permission-filtered image rows.
 *
 * @returns {SkuImageGroup[]}
 *        Grouped image objects ready for API response.
 */
const transformSkuImageGroupsForDetail = (rows) => {
  if (!Array.isArray(rows)) return [];
  
  const groups = new Map();
  
  for (const row of rows) {
    const {
      groupId,
      type,
      id,
      imageUrl,
      altText,
      isPrimary,
      metadata,
      audit,
    } = row;
    
    if (!groups.has(groupId)) {
      groups.set(groupId, {
        groupId,
        isPrimary,
        variants: {},
        audit: audit ?? undefined,
      });
    }
    
    const group = groups.get(groupId);
    
    group.variants[type] = {
      id,
      imageUrl,
      altText,
      metadata: metadata ?? undefined,
    };
  }
  
  return Array.from(groups.values());
};

module.exports = {
  transformGroupedSkuImages,
  transformSkuImageGroupsForDetail,
};

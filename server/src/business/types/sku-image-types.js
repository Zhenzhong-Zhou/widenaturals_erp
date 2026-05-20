/**
 * @file sku-image-types.js
 * @description JSDoc type definitions for the SKU image business domain.
 */

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} SkuImageViewAcl
 * @property {boolean} canViewImages
 * @property {boolean} canViewImageMetadata
 * @property {boolean} canViewImageHistory
 */

/**
 * Raw SKU image row as returned by the repository (includes joined audit fields).
 *
 * @typedef {Object} SkuImageRow
 * @property {string}      id
 * @property {string|null} group_id
 * @property {string}      image_url
 * @property {string|null} image_type
 * @property {boolean}     is_primary
 * @property {string|null} alt_text
 * @property {number|null} file_size_kb
 * @property {string|null} file_format
 * @property {number|null} display_order
 * @property {string|null} uploaded_at
 * @property {string|null} uploaded_by
 * @property {string|null} uploaded_by_firstname
 * @property {string|null} uploaded_by_lastname
 */

/**
 * @typedef {Object} SkuImageForUser
 * @property {string} id
 * @property {string} groupId
 * @property {string|null} imageUrl
 * @property {string} type
 * @property {boolean} isPrimary
 * @property {string|null} altText
 * @property {Object} [metadata]
 * @property {number|null} metadata.sizeKb
 * @property {string|null} metadata.format
 * @property {number|null} metadata.displayOrder
 * @property {Object|null} [audit]
 * @property {Date|string|null} audit.uploadedAt
 * @property {Object|null} audit.uploadedBy
 * @property {string} audit.uploadedBy.id
 * @property {string|null} audit.uploadedBy.firstname
 * @property {string|null} audit.uploadedBy.lastname
 */

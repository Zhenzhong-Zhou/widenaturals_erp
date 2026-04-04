/**
 * @file product-batch-types.js
 * @description JSDoc type definitions for the product batch business domain.
 */

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} ProductBatchVisibilityAcl
 * @property {boolean} canViewAllProductBatches
 * @property {boolean} canViewProductBatches
 * @property {boolean} canViewManufacturer
 * @property {boolean} canSearchProduct
 * @property {boolean} canSearchSku
 * @property {boolean} canSearchManufacturer
 */

/**
 * @typedef {object} ProductBatchAccessAcl
 * @property {boolean} isRoot
 * @property {boolean} canEditBasicMetadata
 * @property {boolean} canEditSensitiveMetadata
 * @property {boolean} canEditReleaseMetadata
 * @property {boolean} canChangeStatus
 */

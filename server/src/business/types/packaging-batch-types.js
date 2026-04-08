/**
 * @file packaging-batch-types.js
 * @description JSDoc type definitions for the packaging material batch business domain.
 */

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} PackagingBatchVisibilityAcl
 * @property {boolean} canViewAllPackagingBatches
 * @property {boolean} canViewPackagingBatches
 * @property {boolean} canViewSupplier
 * @property {boolean} canSearchMaterial
 * @property {boolean} canSearchSupplier
 */

/**
 * @typedef {object} PackagingBatchAccessAcl
 * @property {boolean} isRoot
 * @property {boolean} canEditBasicMetadata
 * @property {boolean} canEditSensitiveMetadata
 * @property {boolean} canChangeStatus
 */

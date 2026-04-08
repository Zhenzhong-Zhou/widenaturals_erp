/**
 * @file sku-code-base-types.js
 * @description JSDoc type definitions for the SKU code base business domain.
 */

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} SkuCodeBaseLookupAcl
 * @property {boolean} canViewAllStatuses
 * @property {boolean} canViewActiveOnly
 */

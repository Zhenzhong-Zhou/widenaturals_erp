/**
 * @file packaging-material-types.js
 * @description JSDoc type definitions for the packaging material business domain.
 */

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} PackagingMaterialLookupAcl
 * @property {boolean} canViewArchived
 * @property {boolean} canViewAllStatuses
 * @property {boolean} canViewHiddenSalesMaterials
 */

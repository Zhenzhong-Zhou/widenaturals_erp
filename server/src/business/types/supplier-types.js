/**
 * @file supplier-types.js
 * @description JSDoc type definitions for the supplier business domain.
 */

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} SupplierVisibilityAcl
 * @property {boolean} canViewAllSuppliers
 * @property {boolean} canViewArchived
 * @property {boolean} canViewInactive
 * @property {boolean} enforceActiveOnly
 */

/**
 * @typedef {object} SupplierLookupSearchAcl
 * @property {boolean} canSearchStatus
 * @property {boolean} canSearchLocation
 */

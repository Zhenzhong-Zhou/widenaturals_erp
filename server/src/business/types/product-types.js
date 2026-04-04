/**
 * @file product-types.js
 * @description JSDoc type definitions for the product business domain.
 */

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} ProductLookupAcl
 * @property {boolean} canViewAllStatuses
 * @property {boolean} canViewActiveOnly
 */

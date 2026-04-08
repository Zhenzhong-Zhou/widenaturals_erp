/**
 * @file location-type-types.js
 * @description JSDoc type definitions for the location type business domain.
 */

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} LocationTypeVisibilityAcl
 * @property {boolean} canViewAllLocationTypes
 * @property {boolean} canViewInactive
 * @property {boolean} enforceActiveOnly
 */

/**
 * @typedef {object} LocationTypeLookupSearchAcl
 * @property {boolean} canSearchStatus
 */

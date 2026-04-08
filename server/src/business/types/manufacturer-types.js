/**
 * @file manufacturer-types.js
 * @description JSDoc type definitions for the manufacturer business domain.
 */

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} ManufacturerVisibilityAcl
 * @property {boolean} canViewAllManufacturers
 * @property {boolean} canViewArchived
 * @property {boolean} canViewInactive
 * @property {boolean} enforceActiveOnly
 */

/**
 * @typedef {object} ManufacturerLookupSearchAcl
 * @property {boolean} canSearchStatus
 * @property {boolean} canSearchLocation
 */

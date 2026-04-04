/**
 * @file discount-types.js
 * @description JSDoc type definitions for the discount business domain.
 */

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} DiscountLookupAcl
 * @property {boolean} canViewAllStatuses
 * @property {boolean} canViewAllValidLookups
 */

/**
 * @file status-types.js
 * @description JSDoc type definitions for the status business domain.
 */

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} StatusLookupAcl
 * @property {boolean} canViewAllStatuses
 * @property {boolean} canViewActiveOnly
 */

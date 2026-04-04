/**
 * @file batch-status-types.js
 * @description JSDoc type definitions for the batch status domain.
 */

'use strict';

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} BatchStatusVisibilityAcl
 * @property {boolean} canViewInactiveBatchStatuses
 * @property {boolean} enforceActiveOnly
 */

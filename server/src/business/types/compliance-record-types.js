/**
 * @file compliance-record-types.js
 * @description JSDoc type definitions for the compliance record business domain.
 */

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} ComplianceViewAcl
 * @property {boolean} canViewCompliance
 * @property {boolean} canViewComplianceMetadata
 * @property {boolean} canViewComplianceHistory
 * @property {boolean} canViewInactiveCompliance
 */

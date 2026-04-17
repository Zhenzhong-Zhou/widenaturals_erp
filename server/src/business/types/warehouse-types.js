/**
 * @file warehouse-types.js
 * @description JSDoc typedefs for warehouse business / ACL layer.
 */

'use strict';

/**
 * Resolved ACL flags for the warehouse domain.
 * Returned by evaluateWarehouseVisibility and consumed by applyWarehouseVisibilityRules
 * and warehouse-transformer.js.
 *
 * @typedef {object} WarehouseAcl
 * @property {boolean} isRoot              - User has unrestricted root access.
 * @property {boolean} canViewAll          - User may see warehouses beyond their assignments.
 * @property {boolean} canViewArchived     - User may see archived warehouses.
 * @property {boolean} canViewAllStatuses  - User may see warehouses in any status.
 */

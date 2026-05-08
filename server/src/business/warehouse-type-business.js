/**
 * @file warehouse-type-business.js
 * @description Business logic layer for warehouse type lookup access
 * control and lookup-row decoration.
 *
 * Owns ACL evaluation, visibility rule enforcement, and active-flag
 * normalisation for the warehouse type lookup endpoint. Contains no
 * orchestration; the service layer owns query execution and
 * transformation.
 *
 * Base read access (VIEW_WAREHOUSE_TYPE_LOOKUP) is enforced by
 * route-level authorize middleware. This layer only resolves
 * scope-level flags and applies the filter shaping they imply.
 *
 * Exports:
 *  - evaluateWarehouseTypeLookupVisibility    — ACL for the lookup endpoint
 *  - resolveWarehouseTypeLookupFilters        — pins isActive=true for restricted callers
 *  - enrichWarehouseTypeLookupWithActiveFlag  — normalises is_active → isActive on a lookup row
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const {
  WAREHOUSE_CONSTANTS,
} = require('../utils/constants/domain/warehouse');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');

const CONTEXT = 'warehouse-type-business';

/**
 * Resolves the ACL for the warehouse type lookup endpoint.
 *
 * Returns scope flags consumed downstream by the lookup workflow:
 *  - `canViewInactive` — true for root or holders of
 *    VIEW_ALL_WAREHOUSE_TYPES; bypasses the active pin in the resolver
 *    and enables the transformer to surface (and tag) inactive rows.
 *
 * Throws AppError.businessError if permission resolution fails.
 *
 * @param {Object} user - Authenticated user from req.auth.user.
 * @returns {Promise<WarehouseTypeLookupAcl>}
 */
const evaluateWarehouseTypeLookupVisibility = async (user) => {
  const context = `${CONTEXT}/evaluateWarehouseTypeLookupVisibility`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    const canViewInactive =
      isRoot ||
      permissions.includes(
        WAREHOUSE_CONSTANTS.PERMISSIONS.VIEW_ALL_WAREHOUSE_TYPES
      );
    
    return { canViewInactive };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate warehouse type lookup visibility',
      { context, userId: user?.id }
    );
    throw AppError.businessError(
      'Unable to evaluate warehouse type lookup visibility.'
    );
  }
};

/**
 * Applies warehouse_types lookup ACL to caller-supplied filters.
 *
 * Pure function — no side effects on inputs. Regular callers are pinned
 * to `isActive: true`, which overrides any caller-supplied value.
 * Privileged callers (root or holders of VIEW_ALL_WAREHOUSE_TYPES,
 * exposed as `canViewInactive`) bypass the pin and see all rows.
 *
 * @param {WarehouseTypeFilters}   filters
 * @param {WarehouseTypeLookupAcl} acl
 * @returns {WarehouseTypeFilters}
 */
const resolveWarehouseTypeLookupFilters = (filters, acl) =>
  acl.canViewInactive ? filters : { ...filters, isActive: true };

module.exports = {
  evaluateWarehouseTypeLookupVisibility,
  resolveWarehouseTypeLookupFilters,
};

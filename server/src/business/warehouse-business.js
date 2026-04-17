/**
 * @file warehouse-business.js
 * @description Business logic layer for warehouse access control and visibility rules.
 *
 * Owns ACL evaluation and server-side filter enforcement for the warehouse domain.
 * Pure rule functions contain no try/catch — only evaluateWarehouseVisibility
 * catches because it calls resolveUserPermissionContext which may fail.
 *
 * Exports:
 *  - evaluateWarehouseVisibility      — resolves ACL flags from user permissions
 *  - applyWarehouseVisibilityRules    — injects server-side filter constraints from ACL
 */

'use strict';

const { resolveUserPermissionContext } = require('../services/permission-service');
const { logSystemException }           = require('../utils/logging/system-logger');
const AppError                         = require('../utils/AppError');
const { WAREHOUSE_CONSTANTS }                  = require('../utils/constants/domain/warehouse');
const { getStatusId }                  = require('../config/status-cache');

const CONTEXT = 'warehouse-business';

// ─── ACL Evaluation ───────────────────────────────────────────────────────────

/**
 * Resolves warehouse ACL flags from the requesting user's permissions.
 *
 * @param {AuthUser} user
 * @returns {Promise<WarehouseAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateWarehouseVisibility = async (user) => {
  const context = `${CONTEXT}/evaluateWarehouseVisibility`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    const can = (key) => isRoot || permissions.includes(key);
    
    return {
      isRoot,
      canViewAll:        can(WAREHOUSE_CONSTANTS.PERMISSIONS.VIEW_ALL),
      canViewArchived:   can(WAREHOUSE_CONSTANTS.PERMISSIONS.VIEW_ARCHIVED),
      canViewAllStatuses: can(WAREHOUSE_CONSTANTS.PERMISSIONS.VIEW_ALL_STATUSES),
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate warehouse visibility ACL', {
      context,
      userId: user?.id,
    });
    
    throw AppError.businessError('Unable to evaluate warehouse access at this time.');
  }
};

// ─── Visibility Rules ─────────────────────────────────────────────────────────

/**
 * Injects server-side filter constraints based on resolved warehouse ACL flags.
 *
 * Restricted users are pinned to active status and excluded from archived records
 * unless their permissions explicitly allow it.
 *
 * @param {object}       filters - Raw filter object from the request.
 * @param {WarehouseAcl} acl
 * @returns {object} Adjusted filters with ACL constraints applied.
 */
const applyWarehouseVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };
  
  if (!acl.canViewAllStatuses) {
    adjusted.statusId = adjusted.statusId ?? getStatusId('warehouse_active');
  }
  
  if (!acl.canViewArchived) {
    adjusted.isArchived = false;
  }
  
  return adjusted;
};

module.exports = {
  evaluateWarehouseVisibility,
  applyWarehouseVisibilityRules,
};

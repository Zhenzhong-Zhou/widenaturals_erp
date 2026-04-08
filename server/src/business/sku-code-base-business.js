/**
 * @file sku-code-base-business.js
 * @description Domain business logic for SKU code base access control
 * evaluation, visibility rule application, and lookup row enrichment.
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const {
  PERMISSIONS,
} = require('../utils/constants/domain/sku-code-base-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const { enforceActiveOnlyVisibilityRules, enrichWithActiveFlag } = require('./lookup-visibility');

const CONTEXT = 'sku-code-base-business';

/**
 * Resolves which SKU code base lookup visibility capabilities the requesting
 * user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<SkuCodeBaseLookupAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateSkuCodeBaseLookupAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateSkuCodeBaseLookupAccessControl`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    return {
      canViewAllStatuses:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_SKU_CODE_BASES),
      canViewActiveOnly:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ACTIVE_SKU_CODE_BASES),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate SKU code base access control',
      { context, userId: user?.id }
    );
    
    throw AppError.businessError(
      'Unable to evaluate access control for SKU code base lookup.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a SKU code base lookup filter object.
 *
 * Restricted users are pinned to the active status via `status_id` and
 * `_activeStatusId`. Elevated users have those constraints removed.
 *
 * @param {object} [filters={}] - Base filter object from the request.
 * @param {SkuCodeBaseLookupAcl} userAccess - Resolved ACL from `evaluateSkuCodeBaseLookupAccessControl`.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const enforceSkuCodeBaseLookupVisibilityRules = (
  filters = {},
  userAccess,
  activeStatusId
) => enforceActiveOnlyVisibilityRules(filters, userAccess, activeStatusId);

/**
 * Enriches a SKU code base lookup row with a derived `isActive` boolean flag.
 *
 * @param {object} row - Raw SKU code base row from the repository.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object & { isActive: boolean }}
 */
const enrichSkuCodeBaseOption = (row, activeStatusId) =>
  enrichWithActiveFlag(row, activeStatusId);

module.exports = {
  evaluateSkuCodeBaseLookupAccessControl,
  enforceSkuCodeBaseLookupVisibilityRules,
  enrichSkuCodeBaseOption,
};

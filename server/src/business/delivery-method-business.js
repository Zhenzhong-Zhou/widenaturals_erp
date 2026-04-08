/**
 * @file delivery-method-business.js
 * @description Domain business logic for delivery method access control
 * evaluation, visibility rule application, and lookup row enrichment.
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const {
  PERMISSIONS,
} = require('../utils/constants/domain/delivery-method-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');

const CONTEXT = 'delivery-method-business';

/**
 * Resolves which delivery method lookup visibility capabilities the
 * requesting user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<DeliveryMethodLookupAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateDeliveryMethodLookupAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateDeliveryMethodLookupAccessControl`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    return {
      canViewAllStatuses:
        isRoot ||
        permissions.includes(PERMISSIONS.VIEW_ALL_DELIVERY_METHOD_STATUSES),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate delivery method lookup access control',
      { context, userId: user?.id }
    );
    
    throw AppError.businessError(
      'Unable to evaluate user access control for delivery method lookup.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a delivery method lookup filter object.
 *
 * Restricted users are pinned to active-only results via `_activeStatusId`.
 * The caller-supplied `statusId` is removed to prevent override.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {DeliveryMethodLookupAcl} userAccess - Resolved ACL from `evaluateDeliveryMethodLookupAccessControl`.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const enforceDeliveryMethodLookupVisibilityRules = (
  filters,
  userAccess,
  activeStatusId
) => {
  const adjusted = { ...filters };
  
  if (!userAccess.canViewAllStatuses) {
    // Remove caller-supplied statusId — active status is pinned via _activeStatusId.
    delete adjusted.statusId;
    if (activeStatusId) {
      adjusted._activeStatusId = activeStatusId;
    }
  }
  
  return adjusted;
};

/**
 * Enriches a delivery method lookup row with derived boolean flags.
 *
 * @param {object} row - Raw delivery method row from the repository.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object & { isActive: boolean, isPickupLocation: boolean }}
 */
const enrichDeliveryMethodRow = (row, activeStatusId) => {
  return {
    ...row,
    isActive: row.status_id === activeStatusId,
    isPickupLocation: row.is_pickup_location === true,
  };
};

module.exports = {
  evaluateDeliveryMethodLookupAccessControl,
  enforceDeliveryMethodLookupVisibilityRules,
  enrichDeliveryMethodRow,
};

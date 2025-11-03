const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const {
  PERMISSIONS,
} = require('../utils/constants/domain/delivery-method-constants');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Determines whether the user can access hidden or extended delivery method lookup values
 * based on their assigned permissions.
 *
 * @param {Object} user - Authenticated user object with a permission set
 * @returns {Promise<{ canViewAllStatuses: boolean }>} Promise resolving to access flags for delivery method visibility
 */
const evaluateDeliveryMethodLookupAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    const canViewAllStatuses =
      isRoot ||
      permissions.includes(PERMISSIONS.VIEW_ALL_DELIVERY_METHOD_STATUSES);

    return { canViewAllStatuses };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate delivery method lookup access control',
      {
        context:
          'delivery-method-business/evaluateDeliveryMethodLookupAccessControl',
        userId: user?.id,
      }
    );

    throw AppError.businessError(
      'Unable to evaluate user access control for delivery method lookup',
      {
        details: err.message,
        stage: 'evaluate-delivery-method-lookup-access',
      }
    );
  }
};

/**
 * Enforces visibility restrictions on delivery method lookup filters
 * based on user access permissions.
 *
 * - Removes the `statusId` filter if the user lacks permission to view all statuses.
 * - Injects `_activeStatusId` internally to enforce active-only filtering.
 * - Does not enforce validity windows (delivery methods do not have `valid_from` / `valid_to`).
 *
 * @param {Object} filters - Original filter object (e.g., `{ keyword, statusId, isPickupLocation }`)
 * @param {Object} userAccess - Access flags (e.g., `canViewAllStatuses`)
 * @param {string|number} [activeStatusId] - Default status ID to enforce (e.g., "active")
 * @returns {Object} Updated filters with access-based restrictions applied
 */
const enforceDeliveryMethodLookupVisibilityRules = (
  filters,
  userAccess,
  activeStatusId
) => {
  const adjusted = { ...filters };

  // Enforce active-only restriction if user can't view all statuses
  if (!userAccess.canViewAllStatuses) {
    delete adjusted.statusId;
    if (activeStatusId) {
      adjusted._activeStatusId = activeStatusId;
    }
  }

  return adjusted;
};

/**
 * Enriches a delivery method row with computed flags such as isActive and isPickupLocation.
 *
 * @param {Object} row - Raw delivery method row with `status_id` and `is_pickup_location`.
 * @param {string|number} activeStatusId - The status ID representing "active".
 * @returns {Object} Enriched row with `isActive` and `isPickupLocation` booleans.
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

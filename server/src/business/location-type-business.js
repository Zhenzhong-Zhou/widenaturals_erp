const { resolveUserPermissionContext } = require('../services/role-permission-service');
const { LOCATION_TYPE_CONSTANTS } = require('../utils/constants/domain/location-type-constants');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Business: Determine which categories of location types
 * the requester is allowed to view in list or lookup contexts.
 *
 * This function resolves LOCATION TYPE VISIBILITY AUTHORITY ONLY.
 * It does NOT inspect filters or shape repository queries.
 *
 * Visibility categories:
 *   ✔ Active location types
 *   ✔ Inactive location types
 *
 * Permission semantics:
 *
 *   - VIEW_INACTIVE_LOCATION_TYPES
 *       Allows viewing location types in inactive status.
 *
 *   - VIEW_ALL_LOCATION_TYPES_VISIBILITY
 *       Full visibility override.
 *       Implicitly allows viewing:
 *         • active
 *         • inactive
 *
 * Root users implicitly bypass visibility restrictions.
 *
 * Derived rule:
 *   - ACTIVE-only visibility enforced by default.
 *
 * @param {Object} user
 *
 * @returns {Promise<{
 *   canViewInactive: boolean,
 *   canViewAllLocationTypes: boolean,
 *   enforceActiveOnly: boolean
 * }>}
 */
const evaluateLocationTypeVisibilityAccessControl = async (user) => {
  try {
    const { permissions, isRoot } =
      await resolveUserPermissionContext(user);
    
    const canViewAllLocationTypes =
      isRoot ||
      permissions.includes(
        LOCATION_TYPE_CONSTANTS.PERMISSIONS
          .VIEW_ALL_LOCATION_TYPES_VISIBILITY
      );
    
    const canViewAllStatuses =
      canViewAllLocationTypes ||
      permissions.includes(
        LOCATION_TYPE_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_SUPPLIERS
      );
    
    const canViewInactive =
      canViewAllLocationTypes ||
      permissions.includes(
        LOCATION_TYPE_CONSTANTS.PERMISSIONS
          .VIEW_INACTIVE_LOCATION_TYPES
      );
    
    const enforceActiveOnly = !canViewInactive;
    
    return {
      canViewAllStatuses,
      canViewInactive,
      canViewAllLocationTypes,
      enforceActiveOnly,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate location type visibility access control',
      {
        context:
          'location-type-business/evaluateLocationTypeVisibilityAccessControl',
        userId: user?.id,
      }
    );
    
    throw AppError.businessError(
      'Unable to evaluate location type visibility access control.',
      { details: err.message }
    );
  }
};


/**
 * Evaluates which lookup search dimensions are available
 * when performing location type lookup queries.
 *
 * This function determines QUERY SHAPING ONLY.
 * It does NOT control visibility.
 *
 * Derived Capabilities:
 *   - canSearchStatus
 *
 * @param {Object} user
 *
 * @returns {Promise<{
 *   canSearchStatus: boolean
 * }>}
 */
const evaluateLocationTypeLookupSearchCapabilities = async (user) => {
  try {
    const { permissions, isRoot } =
      await resolveUserPermissionContext(user);
    
    const canSearchStatus =
      isRoot ||
      permissions.includes(
        LOCATION_TYPE_CONSTANTS.PERMISSIONS
          .SEARCH_LOCATION_TYPES_BY_STATUS
      );
    
    return {
      canSearchStatus,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate location type lookup search capabilities',
      {
        context:
          'location-type-business/evaluateLocationTypeLookupSearchCapabilities',
        userId: user?.id,
      }
    );
    
    throw AppError.businessError(
      'Unable to evaluate location type lookup search capabilities.',
      { details: err.message }
    );
  }
};


/**
 * Enrich a Location Type lookup row with an explicit active-state flag.
 *
 * Purpose:
 * - Provide `isActive` boolean for UI rendering logic.
 * - Allow dropdowns to visually distinguish active vs inactive records.
 *
 * IMPORTANT:
 * - Does NOT affect visibility.
 * - Visibility must already be enforced at repository level.
 * - This is a pure, side-effect-free helper.
 *
 * @param {object} row
 *   Location type lookup row returned from repository.
 *   Expected to include `status_id`.
 *
 * @param {string} activeStatusId
 *   Status ID representing ACTIVE state.
 *
 * @returns {object}
 *   Row enriched with:
 *   - `isActive: boolean`
 *
 * @throws {AppError}
 */
const enrichLocationTypeLookupWithActiveFlag = (
  row,
  activeStatusId
) => {
  if (!row || typeof row !== 'object') {
    throw AppError.validationError(
      '[enrichLocationTypeLookupWithActiveFlag] Invalid row.'
    );
  }
  
  if (!activeStatusId) {
    throw AppError.validationError(
      '[enrichLocationTypeLookupWithActiveFlag] Missing activeStatusId.'
    );
  }
  
  return {
    ...row,
    isActive: row.status_id === activeStatusId,
  };
};


module.exports = {
  evaluateLocationTypeVisibilityAccessControl,
  evaluateLocationTypeLookupSearchCapabilities,
  enrichLocationTypeLookupWithActiveFlag,
};

const { resolveUserPermissionContext } = require('../services/role-permission-service');
const { MANUFACTURER_CONSTANTS } = require('../utils/constants/domain/manufacturer-constants');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Business: Determine which categories of manufacturers
 * the requester is allowed to view in lists or lookup contexts.
 *
 * This function resolves MANUFACTURER VISIBILITY AUTHORITY ONLY.
 * It does NOT inspect filters or shape repository queries.
 *
 * Visibility categories:
 *   ✔ Active manufacturers
 *   ✔ Inactive manufacturers
 *   ✔ Archived manufacturers
 *
 * Permission semantics:
 *
 *   - VIEW_ARCHIVED_MANUFACTURERS
 *       Allows viewing archived records.
 *
 *   - VIEW_INACTIVE_MANUFACTURERS
 *       Allows viewing inactive status records.
 *
 *   - VIEW_ALL_MANUFACTURERS_VISIBILITY
 *       Full visibility override.
 *       Implicitly allows viewing:
 *         • active
 *         • inactive
 *         • archived
 *
 * Root users implicitly bypass manufacturer visibility restrictions.
 *
 * Derived rule:
 *   - ACTIVE-only visibility enforced by default.
 *
 * @param {Object} user
 *
 * @returns {Promise<{
 *   canViewArchived: boolean,
 *   canViewInactive: boolean,
 *   canViewAllManufacturers: boolean,
 *   enforceActiveOnly: boolean
 * }>}
 */
const evaluateManufacturerVisibilityAccessControl = async (user) => {
  try {
    const { permissions, isRoot } =
      await resolveUserPermissionContext(user);
    
    const canViewAllManufacturers =
      isRoot ||
      permissions.includes(
        MANUFACTURER_CONSTANTS.PERMISSIONS.VIEW_ALL_MANUFACTURERS_VISIBILITY
      );
    
    const canViewArchived =
      canViewAllManufacturers ||
      permissions.includes(
        MANUFACTURER_CONSTANTS.PERMISSIONS.VIEW_ARCHIVED_MANUFACTURERS
      );
    
    const canViewAllStatuses =
      canViewAllManufacturers ||
      permissions.includes(
        MANUFACTURER_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_MANUFACTURERS
      );
    
    const canViewInactive =
      canViewAllManufacturers ||
      permissions.includes(
        MANUFACTURER_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_MANUFACTURERS
      );
    
    const enforceActiveOnly = !canViewInactive;
    
    return {
      canViewArchived,
      canViewInactive,
      canViewAllManufacturers,
      canViewAllStatuses,
      enforceActiveOnly,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate manufacturer visibility access control',
      {
        context:
          'manufacturer-business/evaluateManufacturerVisibilityAccessControl',
        userId: user?.id,
      }
    );
    
    throw AppError.businessError(
      'Unable to evaluate manufacturer visibility access control.',
      { details: err.message }
    );
  }
};

/**
 * Evaluates which lookup search dimensions are available to the user
 * when performing manufacturer lookup queries.
 *
 * This function determines QUERY SHAPING ONLY.
 * It does NOT control visibility or enforce status rules.
 *
 * Derived Capabilities:
 *   - canSearchStatus
 *   - canSearchLocation
 *
 * @param {Object} user
 *
 * @returns {Promise<{
 *   canSearchStatus: boolean,
 *   canSearchLocation: boolean
 * }>}
 */
const evaluateManufacturerLookupSearchCapabilities = async (user) => {
  try {
    const { permissions, isRoot } =
      await resolveUserPermissionContext(user);
    
    const canSearchStatus =
      isRoot ||
      permissions.includes(
        MANUFACTURER_CONSTANTS.PERMISSIONS.SEARCH_MANUFACTURERS_BY_STATUS
      );
    
    const canSearchLocation =
      isRoot ||
      permissions.includes(
        MANUFACTURER_CONSTANTS.PERMISSIONS.SEARCH_MANUFACTURERS_BY_LOCATION
      );
    
    return {
      canSearchStatus,
      canSearchLocation,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate manufacturer lookup search capabilities',
      {
        context:
          'manufacturer-business/evaluateManufacturerLookupSearchCapabilities',
        userId: user?.id,
      }
    );
    
    throw AppError.businessError(
      'Unable to evaluate manufacturer lookup search capabilities.',
      { details: err.message }
    );
  }
};

/**
 * Enrich a Manufacturer lookup row with an explicit active-state flag.
 *
 * Purpose:
 * - Expose a simple boolean (`isActive`) for UI rendering logic
 * - Allow lookup UIs to visually differentiate active vs inactive manufacturers
 *   (e.g. disabled dropdown options, muted styling)
 *
 * IMPORTANT:
 * - This function does NOT affect visibility rules.
 * - Visibility must already be enforced at the SQL/repository layer.
 * - Inactive rows must already be permitted by ACL.
 * - This is a pure, side-effect-free transformation helper.
 *
 * @param {object} row
 *   Manufacturer lookup row returned from repository.
 *   Expected to include `status_id`.
 *
 * @param {string} activeStatusId
 *   Status ID representing the ACTIVE manufacturer state.
 *
 * @returns {object}
 *   Original row enriched with:
 *   - `isActive: boolean`
 *
 * @throws {AppError}
 *   If input validation fails.
 */
const enrichManufacturerLookupWithActiveFlag = (
  row,
  activeStatusId
) => {
  if (!row || typeof row !== 'object') {
    throw AppError.validationError(
      '[enrichManufacturerLookupWithActiveFlag] Invalid row.'
    );
  }
  
  if (!activeStatusId) {
    throw AppError.validationError(
      '[enrichManufacturerLookupWithActiveFlag] Missing activeStatusId.'
    );
  }
  
  return {
    ...row,
    isActive: row.status_id === activeStatusId,
  };
};

module.exports = {
  evaluateManufacturerVisibilityAccessControl,
  evaluateManufacturerLookupSearchCapabilities,
  enrichManufacturerLookupWithActiveFlag,
};

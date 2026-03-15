const { resolveUserPermissionContext } = require('../services/role-permission-service');
const { BATCH_CONSTANTS } = require('../utils/constants/domain/batch-constants');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Evaluate access control rules for batch status visibility.
 *
 * Determines what batch statuses the current user is allowed to see
 * based on their resolved permission context.
 *
 * Visibility levels:
 * - Root users or users with `VIEW_ALL_BATCH_STATUSES` can see all statuses.
 * - Users with `VIEW_INACTIVE_BATCH_STATUSES` can see both active and inactive statuses.
 * - All other users are restricted to active statuses only.
 *
 * This function performs **no database access** itself and relies on the
 * centralized permission resolver to determine the user's effective permissions.
 *
 * @async
 * @param {Object} user - Authenticated user object from request context.
 *
 * @returns {boolean} return.canViewAllStatuses
 * Indicates the user can view all batch statuses without restriction.
 *
 * @returns {boolean} return.canViewInactiveBatchStatuses
 * Indicates the user can view inactive statuses.
 *
 * @returns {boolean} return.enforceActiveOnly
 * Indicates only active statuses should be returned.
 *
 * @returns {Promise<{
 *   canViewAllStatuses: boolean,
 *   canViewInactiveBatchStatuses: boolean,
 *   enforceActiveOnly: boolean
 * }>}
 */
const evaluateBatchStatusVisibilityAccessControl = async (user) => {
  const context = 'batch-status-business/evaluateBatchStatusVisibilityAccessControl';
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    //---------------------------------------------------------
    // Full visibility override
    //---------------------------------------------------------
    const canViewAllStatuses =
      isRoot ||
      permissions.includes(
        BATCH_CONSTANTS.PERMISSIONS.VIEW_ALL_BATCH_STATUSES
      );
    
    //---------------------------------------------------------
    // Inactive visibility permission
    //---------------------------------------------------------
    const canViewInactiveBatchStatuses =
      canViewAllStatuses ||
      permissions.includes(
        BATCH_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_BATCH_STATUSES
      );
    
    //---------------------------------------------------------
    // Default rule: restrict to ACTIVE statuses only
    //---------------------------------------------------------
    const enforceActiveOnly = !canViewInactiveBatchStatuses;
    
    return {
      canViewAllStatuses,
      canViewInactiveBatchStatuses,
      enforceActiveOnly,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate batch status visibility access control',
      {
        context,
        userId: user?.id,
      }
    );
    
    throw AppError.businessError(
      'Unable to evaluate batch status visibility access control.',
      { details: err.message }
    );
  }
};

/**
 * Apply visibility rules to batch status lookup filters.
 *
 * This function mutates query filters based on the user's
 * evaluated access control flags. It ensures the repository
 * query respects the user's permission scope.
 *
 * Rules:
 * - If user can view all statuses → remove active restrictions.
 * - If active-only enforcement applies → force `enforceActiveOnly`.
 *
 * Designed specifically for **lookup queries**, where inactive
 * statuses may optionally be hidden from limited-permission users.
 *
 * @param {Object} filters - Incoming lookup filters from request.
 * @param {Object} acl - Access control flags returned from
 * `evaluateBatchStatusVisibilityAccessControl`.
 *
 * @returns {Object} Adjusted filters safe for repository queries.
 */
const applyBatchStatusLookupVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };
  
  //---------------------------------------------------------
  // Full visibility override
  //---------------------------------------------------------
  if (acl.canViewAllStatuses) {
    // Remove enforced active-only restriction
    delete adjusted.enforceActiveOnly;
    return adjusted;
  }
  
  //---------------------------------------------------------
  // Default rule: ACTIVE-only
  //---------------------------------------------------------
  if (acl.enforceActiveOnly) {
    // Enforce repository-level filtering
    adjusted.enforceActiveOnly = true;
    
    // Prevent clients from overriding active filtering
    delete adjusted.isActive;
  }
  
  return adjusted;
};

/**
 * Enrich batch status lookup rows with a normalized `isActive` flag.
 *
 * Converts the database column `is_active` into a normalized
 * API response field `isActive`. This ensures frontend consumers
 * always receive a consistent boolean flag regardless of how
 * the database stores the value.
 *
 * This helper is typically used in lookup transformers when
 * preparing rows for API responses.
 *
 * @param {Object} row - Raw database row.
 *
 * @returns {Object} Row enriched with `isActive`.
 *
 * @throws {AppError.validationError}
 * If the input row is invalid.
 */
const enrichBatchStatusLookupWithActiveFlag = (row) => {
  if (!row || typeof row !== 'object') {
    throw AppError.validationError(
      '[enrichBatchStatusLookupWithActiveFlag] Invalid `row`.'
    );
  }
  
  return {
    ...row,
    isActive: Boolean(row.is_active),
  };
};

module.exports = {
  evaluateBatchStatusVisibilityAccessControl,
  applyBatchStatusLookupVisibilityRules,
  enrichBatchStatusLookupWithActiveFlag,
};

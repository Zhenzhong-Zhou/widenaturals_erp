const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const {
  STATUS_CONSTANTS,
} = require('../utils/constants/domain/status-constants');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Evaluates access control flags for Status lookup based on user permissions.
 *
 * Determines whether the current user is allowed to view:
 * - All statuses (canViewAllStatuses)
 * - Only active statuses (canViewActiveOnly)
 *
 * Used before constructing filters or lookup queries.
 *
 * @param {object} user - User authentication context.
 *
 * @returns {Promise<{ canViewAllStatuses: boolean, canViewActiveOnly: boolean }>}
 *
 * @throws {AppError} If permission context resolution fails.
 */
const evaluateStatusLookupAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    return {
      canViewAllStatuses:
        isRoot ||
        permissions.includes(STATUS_CONSTANTS.PERMISSIONS.VIEW_ALL_STATUSES),

      canViewActiveOnly:
        isRoot ||
        permissions.includes(STATUS_CONSTANTS.PERMISSIONS.VIEW_ACTIVE_STATUSES),
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate Status lookup access control', {
      context: 'status-business/evaluateStatusLookupAccessControl',
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate access control for Status lookup.',
      {
        details: err.message,
        stage: 'evaluate-status-access',
      }
    );
  }
};

/**
 * Enforces visibility rules for Status lookup based on user permissions.
 *
 * - If user cannot view all statuses → enforce `is_active = true`
 * - If user can view all statuses → remove enforced restrictions
 *
 * @param {object} [filters={}] - Incoming filter set from service/controller.
 * @param {object} userAccess - Returned from evaluateStatusLookupAccessControl().
 *
 * @returns {object} Adjusted filters object.
 */
const enforceStatusLookupVisibilityRules = (filters = {}, userAccess) => {
  const adjusted = { ...filters };

  if (!userAccess.canViewAllStatuses) {
    // Restricted users → active-only visibility
    adjusted.is_active ??= true;
    adjusted._isActiveEnforced = true;
  } else {
    // Elevated/admin → unrestricted visibility
    delete adjusted.is_active;
    delete adjusted._isActiveEnforced;
  }

  return adjusted;
};

/**
 * Enriches a Status lookup row with UI-friendly flags.
 *
 * Adds:
 *   - `isActive`: normalized boolean based on row.is_active / row.isActive
 *
 * @param {object} row - Raw status DB row.
 *
 * @returns {object} Row enriched with normalized `isActive`.
 *
 * @throws {AppError} If missing required fields.
 */
const enrichStatusLookupOption = (row) => {
  if (!row || typeof row !== 'object') {
    throw AppError.validationError(
      `[enrichStatusLookupOption] Invalid 'row'. Expected object but received ${typeof row}.`
    );
  }

  const rawIsActive =
    typeof row.is_active === 'boolean'
      ? row.is_active
      : typeof row.isActive === 'boolean'
        ? row.isActive
        : null;

  if (rawIsActive === null) {
    throw AppError.validationError(
      '[enrichStatusLookupOption] Missing boolean "is_active" or "isActive".'
    );
  }

  return {
    ...row,
    isActive: rawIsActive,
  };
};

module.exports = {
  evaluateStatusLookupAccessControl,
  enforceStatusLookupVisibilityRules,
  enrichStatusLookupOption,
};

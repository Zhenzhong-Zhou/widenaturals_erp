const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const {
  PERMISSIONS,
} = require('../utils/constants/domain/sku-code-base-constants');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Evaluates access control flags for SKU Code Base lookup based on user permissions.
 *
 * Determines whether the current user is allowed to view:
 * - All SKU Code Base statuses (`canViewAllStatuses`)
 * - Only active SKU Code Bases (`canViewActiveOnly`)
 *
 * Used before building filters or lookup queries.
 *
 * @param {object} user - The user object for permission resolution.
 * @returns {Promise<{ canViewAllStatuses: boolean, canViewActiveOnly: boolean }>}
 *
 * @throws {AppError} - If permission context resolution fails.
 */
const evaluateSkuCodeBaseLookupAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    return {
      canViewAllStatuses:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_SKU_CODE_BASES),
      canViewActiveOnly:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ACTIVE_SKU_CODE_BASES),
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate SKU Code Base access control', {
      context: 'sku-code-base-business/evaluateSkuCodeBaseLookupAccessControl',
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate access control for SKU Code Base lookup',
      {
        details: err.message,
        stage: 'evaluate-sku-code-base-access',
      }
    );
  }
};

/**
 * Enforces access-based status visibility rules for SKU Code Base lookup filters.
 *
 * Mutates a shallow copy of incoming `filters` to enforce:
 * - Active-only status if user has limited permissions
 * - Removal of enforced filters if user has elevated permissions
 *
 * @param {object} [filters={}] - Initial filter set from caller.
 * @param {object} userAccess - From `evaluateSkuCodeBaseLookupAccessControl`.
 * @param {string} activeStatusId - ID of the "active" status to enforce.
 * @returns {object} - The adjusted filters object.
 */
const enforceSkuCodeBaseLookupVisibilityRules = (
  filters = {},
  userAccess,
  activeStatusId
) => {
  const adjusted = { ...filters };

  // If user *cannot* view all statuses, enforce active-only restrictions
  if (!userAccess.canViewAllStatuses) {
    adjusted.status_id ??= activeStatusId;
    adjusted._activeStatusId = activeStatusId;
  } else {
    // Elevated users do not require enforced status restrictions
    delete adjusted.status_id;
    delete adjusted._activeStatusId;
  }

  return adjusted;
};

/**
 * Enriches a SKU Code Base database row with UI-ready flags.
 *
 * Adds derived boolean fields:
 * - `isActive`: Whether the row's `status_id` matches the provided active status ID.
 *
 * Useful for dropdowns, autocomplete lists, and SKU code–related UI logic.
 *
 * @param {object} row - The raw SKU Code Base row from the database.
 *   Expected to contain at least:
 *     - `status_id: string`
 *
 * @param {string} activeStatusId - The status ID representing an "active" SKU code base entry.
 *
 * @throws {AppError} If the row is invalid or activeStatusId is missing/invalid.
 *
 * @returns {object} A new object containing all original fields plus:
 *   - `isActive: boolean`
 *
 * @example
 * const enriched = enrichSkuCodeBaseOption(codeBaseRow, ACTIVE_STATUS_ID);
 * if (enriched.isActive) { ... }
 */
const enrichSkuCodeBaseOption = (row, activeStatusId) => {
  // Validate row
  if (!row || typeof row !== 'object') {
    throw AppError.validationError(
      '[enrichSkuCodeBaseOption] Invalid `row` - expected object but got ' +
        typeof row
    );
  }

  // Validate activeStatusId
  if (typeof activeStatusId !== 'string' || activeStatusId.length === 0) {
    throw AppError.validationError(
      '[enrichSkuCodeBaseOption] Missing or invalid `activeStatusId`'
    );
  }

  return {
    ...row,
    isActive: row.status_id === activeStatusId,
  };
};

module.exports = {
  evaluateSkuCodeBaseLookupAccessControl,
  enforceSkuCodeBaseLookupVisibilityRules,
  enrichSkuCodeBaseOption,
};

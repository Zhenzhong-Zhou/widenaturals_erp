const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const {
  PERMISSIONS,
} = require('../utils/constants/domain/packaging-material-constants');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Evaluates user permission context for packaging material lookups.
 *
 * Grants access flags for:
 * - Archived materials (admin-facing or audit views)
 * - All status values (e.g., inactive, deprecated)
 * - Hidden sales materials (excluded from sales order dropdowns by default)
 *
 * @param {object} user - Authenticated user object.
 * @returns {Promise<{
 *   canViewArchived: boolean,
 *   canViewAllStatuses: boolean,
 *   canViewHiddenSalesMaterials: boolean
 * }>}
 * @throws {AppError} If permission evaluation fails.
 *
 * @example
 * const access = await evaluatePackagingMaterialLookupAccessControl(user);
 * if (access.canViewArchived) { /* include archived in admin tables *\/ }
 */
const evaluatePackagingMaterialLookupAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    return {
      canViewArchived:
        isRoot ||
        permissions.includes(PERMISSIONS.VIEW_ARCHIVED_PACKAGING_MATERIALS),
      canViewAllStatuses:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_PACKAGING_STATUSES),
      canViewHiddenSalesMaterials:
        isRoot ||
        permissions.includes(PERMISSIONS.VIEW_HIDDEN_SALES_PACKAGING_MATERIALS),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate packaging material lookup access control',
      {
        context: 'packaging-materials-business/evaluateLookupAccessControl',
        userId: user?.id,
      }
    );
    throw AppError.businessError(
      'Unable to evaluate access control for packaging material lookup',
      {
        details: err.message,
        stage: 'evaluate-lookup-access',
      }
    );
  }
};

/**
 * Applies role-based restrictions to packaging material filters.
 *
 * Behavior:
 * - If the user CANNOT view all statuses:
 *   - Forces active-only by setting `restrictToActiveStatus = true`.
 *   - Injects `_activeStatusId` for internal enforcement.
 *   - Forces unarchived-only via `restrictToUnarchived = true`.
 *   - Removes any caller-provided `statusId`.
 *   - Requires `activeStatusId`; throws if missing.
 * - If the user CAN view all statuses:
 *   - Removes internally enforced flags (`_activeStatusId`, `restrictToUnarchived`, `restrictToActiveStatus`).
 *   - Preserves any caller-provided `statusId`/archive filters.
 *
 * Note: This function returns a shallow copy of the provided filters and may add internal flags
 * used downstream by the repository/query builder.
 *
 * @param {object} filters - Incoming filters from the request.
 * @param {{
 *   canViewAllStatuses: boolean,
 *   canViewArchived?: boolean,
 *   canViewHiddenSalesMaterials?: boolean
 * }} userAccess - Access control flags.
 * @param {string} activeStatusId - Status ID to enforce when restricting to active-only.
 * @returns {object} Adjusted filters with enforcement flags applied/removed.
 * @throws {AppError} If `activeStatusId` is missing for restricted views.
 *
 * @example
 * const adjusted = enforcePackagingMaterialVisibilityRules(req.query, access, ACTIVE_STATUS_ID);
 * // adjusted may include: { ...req.query, restrictToActiveStatus: true, _activeStatusId: ACTIVE_STATUS_ID, restrictToUnarchived: true }
 */
const enforcePackagingMaterialVisibilityRules = (
  filters,
  userAccess,
  activeStatusId
) => {
  const adjusted = { ...filters };

  if (!userAccess.canViewAllStatuses) {
    // Enforce active-only
    delete adjusted.statusId;
    adjusted.restrictToActiveStatus = true;

    if (!activeStatusId) {
      throw AppError.validationError(
        'Missing activeStatusId for restricted status view',
        {
          field: 'activeStatusId',
          stage: 'enforcePackagingMaterialVisibilityRules',
        }
      );
    }
    adjusted._activeStatusId = activeStatusId;

    // Enforce unarchived-only
    adjusted.restrictToUnarchived = true;
  } else {
    // Elevated access: remove forced restrictions
    delete adjusted._activeStatusId;
    delete adjusted.restrictToUnarchived;
    // Note: keep any caller-provided statusId/archive filters
  }

  return adjusted;
};

/**
 * Enriches a packaging material row with UI-friendly flags.
 *
 * Adds:
 * - `isActive`: true when `row.status_id === activeStatusId`.
 * - `isArchived`: true when `row.is_archived === true`.
 *
 * Useful when transforming DB records for dropdowns/select lists.
 *
 * @param {{ status_id: string, is_archived?: boolean, [key:string]: any }} row
 *   Raw packaging material row.
 * @param {string} activeStatusId - Status ID representing "active".
 * @returns {object} The enriched material record with `isActive` and `isArchived`.
 *
 * @example
 * const enriched = enrichPackagingMaterialOption(row, ACTIVE_STATUS_ID);
 * if (enriched.isActive && !enriched.isArchived) { /* show in dropdown *\/ }
 */
const enrichPackagingMaterialOption = (row, activeStatusId) => {
  return {
    ...row,
    isActive: row.status_id === activeStatusId,
    isArchived: row.is_archived === true,
  };
};

module.exports = {
  evaluatePackagingMaterialLookupAccessControl,
  enforcePackagingMaterialVisibilityRules,
  enrichPackagingMaterialOption,
};

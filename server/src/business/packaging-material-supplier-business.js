const { createLookupAccessControl } = require('./lookup/lookup-access-control-factory');
const { PERMISSIONS } = require('../utils/constants/domain/packaging-material-supplier-constants');
const AppError = require('../utils/AppError');

/**
 * Access control evaluator for packaging material supplier lookup.
 *
 * This function is created using `createLookupAccessControl` and evaluates
 * user permissions to determine visibility rules for supplier lookup queries.
 *
 * Determines whether the user can:
 * - View all supplier statuses (no restriction)
 * - View archived suppliers
 *
 * NOTE:
 * - "Active-only" enforcement is derived later based on `canViewAllStatuses`.
 * - Permissions are resolved via `resolveUserPermissionContext`.
 *
 * @param {object} user
 * @param {string} user.id - User identifier (required for permission resolution)
 *
 * @returns {Promise<{
 *   canViewAllStatuses: boolean,
 *   canViewArchived: boolean
 * }>}
 */
const evaluatePackagingMaterialSupplierLookupAccessControl =
  createLookupAccessControl({
    context: 'packaging-material-supplier-lookup',
    permissionsMap: {
      canViewAllStatuses:
      PERMISSIONS.VIEW_ALL_PACKAGING_MATERIAL_SUPPLIERS,
      canViewArchived:
      PERMISSIONS.VIEW_ARCHIVED_PACKAGING_MATERIAL_SUPPLIERS,
    },
  });

/**
 * Applies access-based visibility rules to packaging material supplier lookup filters.
 *
 * Rules:
 * - If user CANNOT view all statuses:
 *     → enforce ACTIVE-only filter
 *     → inject `activeStatusId`
 * - If user CAN view all statuses:
 *     → remove enforced status filters (allow full visibility)
 *
 * - If user CANNOT view archived:
 *     → force `includeArchived = false`
 * - If user CAN view archived:
 *     → allow client override (`filters.includeArchived`)
 *
 * @param {object} [filters={}]
 * @param {object} userAccess
 * @param {boolean} userAccess.canViewAllStatuses
 * @param {boolean} userAccess.canViewArchived
 * @param {string} activeStatusId
 *
 * @returns {object} adjustedFilters
 */
const enforcePackagingMaterialSupplierLookupVisibilityRules = (
  filters = {},
  userAccess,
  activeStatusId
) => {
  const adjusted = { ...filters };
  
  //---------------------------------------------------------
  // ACTIVE status enforcement
  //---------------------------------------------------------
  if (!userAccess.canViewAllStatuses) {
    adjusted.enforceActiveOnly = true;
    adjusted.activeStatusId = activeStatusId;
  } else {
    delete adjusted.enforceActiveOnly;
    delete adjusted.activeStatusId;
  }
  
  //---------------------------------------------------------
  // Archived visibility enforcement
  //---------------------------------------------------------
  if (!userAccess.canViewArchived) {
    adjusted.includeArchived = false;
  } else {
    // Allow override if user has permission
    adjusted.includeArchived = filters.includeArchived === true;
  }
  
  return adjusted;
};

/**
 * Enriches a packaging material supplier lookup row with derived flags.
 *
 * Adds:
 * - isActive   → based on supplier status
 * - isPreferred → normalized boolean
 * - isArchived → normalized boolean
 *
 * @param {object} row
 * @param {string} activeStatusId
 *
 * @returns {object} enrichedRow
 */
const enrichPackagingMaterialSupplierLookupWithActiveFlag = (
  row,
  activeStatusId
) => {
  if (!row || typeof row !== 'object') {
    throw AppError.validationError(
      '[enrichPackagingMaterialSupplierLookupWithActiveFlag] Invalid `row`.'
    );
  }
  
  if (typeof activeStatusId !== 'string' || !activeStatusId) {
    throw AppError.validationError(
      '[enrichPackagingMaterialSupplierLookupWithActiveFlag] Missing or invalid activeStatusId.'
    );
  }
  
  //---------------------------------------------------------
  // Add derived flags without mutating original row
  //---------------------------------------------------------
  return {
    ...row,
    isActive: row.status_id === activeStatusId,
    isPreferred: row.is_preferred ?? false,
    isArchived: row.is_archived === true,
  };
};

module.exports = {
  evaluatePackagingMaterialSupplierLookupAccessControl,
  enforcePackagingMaterialSupplierLookupVisibilityRules,
  enrichPackagingMaterialSupplierLookupWithActiveFlag,
};

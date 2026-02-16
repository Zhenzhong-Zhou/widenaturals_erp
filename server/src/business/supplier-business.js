const { resolveUserPermissionContext } = require('../services/role-permission-service');
const { SUPPLIER_CONSTANTS } = require('../utils/constants/domain/supplier-constants');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Business: Determine which categories of suppliers
 * the requester is allowed to view in list or lookup contexts.
 *
 * This function resolves SUPPLIER VISIBILITY AUTHORITY ONLY.
 * It does NOT inspect filters or shape repository queries.
 *
 * Visibility categories:
 *   ✔ Active suppliers
 *   ✔ Inactive suppliers
 *   ✔ Archived suppliers
 *
 * Permission semantics:
 *
 *   - VIEW_ARCHIVED_SUPPLIERS
 *       Allows viewing archived suppliers.
 *
 *   - VIEW_INACTIVE_SUPPLIERS
 *       Allows viewing inactive status suppliers.
 *
 *   - VIEW_ALL_SUPPLIERS_VISIBILITY
 *       Full visibility override.
 *       Implicitly allows viewing:
 *         • active
 *         • inactive
 *         • archived
 *
 * Root users implicitly bypass supplier visibility restrictions.
 *
 * Derived rule:
 *   - ACTIVE-only visibility enforced by default.
 *
 * @param {Object} user
 *
 * @returns {Promise<{
 *   canViewArchived: boolean,
 *   canViewInactive: boolean,
 *   canViewAllSuppliers: boolean,
 *   enforceActiveOnly: boolean
 * }>}
 */
const evaluateSupplierVisibilityAccessControl = async (user) => {
  try {
    const { permissions, isRoot } =
      await resolveUserPermissionContext(user);
    
    const canViewAllSuppliers =
      isRoot ||
      permissions.includes(
        SUPPLIER_CONSTANTS.PERMISSIONS.VIEW_ALL_SUPPLIERS_VISIBILITY
      );
    
    const canViewArchived =
      canViewAllSuppliers ||
      permissions.includes(
        SUPPLIER_CONSTANTS.PERMISSIONS.VIEW_ARCHIVED_SUPPLIERS
      );
    
    const canViewAllStatuses =
      canViewAllSuppliers ||
      permissions.includes(
        SUPPLIER_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_SUPPLIERS
      );
    
    const canViewInactive =
      canViewAllSuppliers ||
      permissions.includes(
        SUPPLIER_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_SUPPLIERS
      );
    
    const enforceActiveOnly = !canViewInactive;
    
    return {
      canViewArchived,
      canViewInactive,
      canViewAllSuppliers,
      canViewAllStatuses,
      enforceActiveOnly,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate supplier visibility access control',
      {
        context:
          'supplier-business/evaluateSupplierVisibilityAccessControl',
        userId: user?.id,
      }
    );
    
    throw AppError.businessError(
      'Unable to evaluate supplier visibility access control.',
      { details: err.message }
    );
  }
};

/**
 * Evaluates which lookup search dimensions are available to the user
 * when performing supplier lookup queries.
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
const evaluateSupplierLookupSearchCapabilities = async (user) => {
  try {
    const { permissions, isRoot } =
      await resolveUserPermissionContext(user);
    
    const canSearchStatus =
      isRoot ||
      permissions.includes(
        SUPPLIER_CONSTANTS.PERMISSIONS.SEARCH_SUPPLIERS_BY_STATUS
      );
    
    const canSearchLocation =
      isRoot ||
      permissions.includes(
        SUPPLIER_CONSTANTS.PERMISSIONS.SEARCH_SUPPLIERS_BY_LOCATION
      );
    
    return {
      canSearchStatus,
      canSearchLocation,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate supplier lookup search capabilities',
      {
        context:
          'supplier-business/evaluateSupplierLookupSearchCapabilities',
        userId: user?.id,
      }
    );
    
    throw AppError.businessError(
      'Unable to evaluate supplier lookup search capabilities.',
      { details: err.message }
    );
  }
};

/**
 * Enrich a Supplier lookup row with an explicit active-state flag.
 *
 * Purpose:
 * - Expose a simple boolean (`isActive`) for UI rendering logic
 * - Allow supplier lookup UIs to visually differentiate active vs inactive
 *   suppliers (e.g. disabled options, muted styling, warning indicators)
 *
 * IMPORTANT:
 * - This function does NOT affect visibility rules.
 * - Visibility must already be enforced at the SQL/repository layer.
 * - Inactive suppliers must already be permitted by ACL.
 * - This is a pure, side-effect-free transformation helper.
 *
 * Usage guidance:
 * - Attach `isActive` only when inactive suppliers may appear
 *   in the result set (e.g. privileged lookup contexts).
 * - Omit this enrichment for active-only lookups to keep payload minimal.
 *
 * @param {object} row
 *   Supplier lookup row returned from repository.
 *   Expected to include `status_id`.
 *
 * @param {string} activeStatusId
 *   Status ID representing the ACTIVE supplier state.
 *   Must be resolved by the service layer.
 *
 * @returns {object}
 *   Original row enriched with:
 *   - `isActive: boolean`
 *
 * @throws {AppError}
 *   If input validation fails.
 */
const enrichSupplierLookupWithActiveFlag = (
  row,
  activeStatusId
) => {
  if (!row || typeof row !== 'object') {
    throw AppError.validationError(
      '[enrichSupplierLookupWithActiveFlag] Invalid row.'
    );
  }
  
  if (!activeStatusId) {
    throw AppError.validationError(
      '[enrichSupplierLookupWithActiveFlag] Missing activeStatusId.'
    );
  }
  
  return {
    ...row,
    isActive: row.status_id === activeStatusId,
  };
};

module.exports = {
  evaluateSupplierVisibilityAccessControl,
  evaluateSupplierLookupSearchCapabilities,
  enrichSupplierLookupWithActiveFlag,
};

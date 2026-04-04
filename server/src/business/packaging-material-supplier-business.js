/**
 * @file packaging-material-supplier-business.js
 * @description Domain business logic for packaging material supplier access
 * control evaluation, visibility rule application, and lookup row enrichment.
 */

'use strict';

const { createLookupAccessControl } = require('./lookup-access-control');
const {
  PERMISSIONS,
} = require('../utils/constants/domain/packaging-material-supplier-constants');

/**
 * Resolves which packaging material supplier lookup visibility capabilities
 * the requesting user holds.
 *
 * @type {(user: AuthUser) => Promise<Record<string, boolean>>}
 */
const evaluatePackagingMaterialSupplierLookupAccessControl =
  createLookupAccessControl({
    context: 'packaging-material-supplier-lookup',
    permissionsMap: {
      canViewAllStatuses: PERMISSIONS.VIEW_ALL_PACKAGING_MATERIAL_SUPPLIERS,
      canViewArchived:    PERMISSIONS.VIEW_ARCHIVED_PACKAGING_MATERIAL_SUPPLIERS,
    },
  });

/**
 * Applies ACL-driven visibility rules to a packaging material supplier lookup
 * filter object.
 *
 * Restricted users are pinned to active-only results and archived records are
 * excluded. Elevated users may include archived records if explicitly requested.
 *
 * @param {object} [filters={}] - Base filter object from the request.
 * @param {PackagingMaterialSupplierLookupAcl} userAccess - Resolved ACL.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const enforcePackagingMaterialSupplierLookupVisibilityRules = (
  filters = {},
  userAccess,
  activeStatusId
) => {
  const adjusted = { ...filters };
  
  if (!userAccess.canViewAllStatuses) {
    adjusted.enforceActiveOnly = true;
    adjusted.activeStatusId    = activeStatusId;
  } else {
    delete adjusted.enforceActiveOnly;
    delete adjusted.activeStatusId;
  }
  
  // Archived records excluded by default — elevated users may opt in explicitly.
  adjusted.includeArchived = userAccess.canViewArchived
    ? filters.includeArchived === true
    : false;
  
  return adjusted;
};

/**
 * Enriches a packaging material supplier lookup row with derived boolean flags.
 *
 * @param {object} row - Raw supplier row from the repository.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object & { isActive: boolean, isPreferred: boolean, isArchived: boolean }}
 */
const enrichPackagingMaterialSupplierLookupWithActiveFlag = (
  row,
  activeStatusId
) => {
  return {
    ...row,
    isActive:    row.status_id === activeStatusId,
    isPreferred: row.is_preferred ?? false,
    isArchived:  row.is_archived === true,
  };
};

module.exports = {
  evaluatePackagingMaterialSupplierLookupAccessControl,
  enforcePackagingMaterialSupplierLookupVisibilityRules,
  enrichPackagingMaterialSupplierLookupWithActiveFlag,
};

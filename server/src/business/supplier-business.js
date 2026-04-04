/**
 * @file supplier-business.js
 * @description Domain business logic for supplier visibility access control
 * evaluation, lookup search capability resolution, and row enrichment.
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const {
  SUPPLIER_CONSTANTS,
} = require('../utils/constants/domain/supplier-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const { enrichWithActiveFlag } = require('./lookup-visibility');

const CONTEXT = 'supplier-business';

/**
 * Resolves which supplier visibility capabilities the requesting user holds.
 *
 * `canViewAllSuppliers` is a full override — it implies archived and inactive
 * visibility. `enforceActiveOnly` is the default — lifted only when the user
 * can view inactive suppliers.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<SupplierVisibilityAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateSupplierVisibilityAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateSupplierVisibilityAccessControl`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
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
    
    const canViewInactive =
      canViewAllSuppliers ||
      permissions.includes(
        SUPPLIER_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_SUPPLIERS
      );
    
    return {
      canViewAllSuppliers,
      canViewArchived,
      canViewInactive,
      enforceActiveOnly: !canViewInactive,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate supplier visibility access control',
      { context, userId: user?.id }
    );
    
    throw AppError.businessError(
      'Unable to evaluate supplier visibility access control.'
    );
  }
};

/**
 * Resolves which supplier lookup search capabilities the requesting user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<SupplierLookupSearchAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateSupplierLookupSearchCapabilities = async (user) => {
  const context = `${CONTEXT}/evaluateSupplierLookupSearchCapabilities`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    return {
      canSearchStatus:
        isRoot ||
        permissions.includes(
          SUPPLIER_CONSTANTS.PERMISSIONS.SEARCH_SUPPLIERS_BY_STATUS
        ),
      canSearchLocation:
        isRoot ||
        permissions.includes(
          SUPPLIER_CONSTANTS.PERMISSIONS.SEARCH_SUPPLIERS_BY_LOCATION
        ),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate supplier lookup search capabilities',
      { context, userId: user?.id }
    );
    
    throw AppError.businessError(
      'Unable to evaluate supplier lookup search capabilities.'
    );
  }
};

/**
 * Enriches a supplier lookup row with a derived `isActive` boolean flag.
 *
 * @param {object} row - Raw supplier row from the repository.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object & { isActive: boolean }}
 */
const enrichSupplierLookupWithActiveFlag = (row, activeStatusId) =>
  enrichWithActiveFlag(row, activeStatusId);

module.exports = {
  evaluateSupplierVisibilityAccessControl,
  evaluateSupplierLookupSearchCapabilities,
  enrichSupplierLookupWithActiveFlag,
};

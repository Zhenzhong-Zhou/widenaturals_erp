/**
 * @file manufacturer-business.js
 * @description Domain business logic for manufacturer visibility access control
 * evaluation, lookup search capability resolution, and row enrichment.
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const {
  MANUFACTURER_CONSTANTS,
} = require('../utils/constants/domain/manufacturer-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const { enrichWithActiveFlag } = require('./lookup-visibility');

const CONTEXT = 'manufacturer-business';

/**
 * Resolves which manufacturer visibility capabilities the requesting user holds.
 *
 * `canViewAllManufacturers` is a full override — it implies archived and
 * inactive visibility. `enforceActiveOnly` is the default — lifted only when
 * the user can view inactive manufacturers.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<ManufacturerVisibilityAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateManufacturerVisibilityAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateManufacturerVisibilityAccessControl`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
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
    
    const canViewInactive =
      canViewAllManufacturers ||
      permissions.includes(
        MANUFACTURER_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_MANUFACTURERS
      );
    
    return {
      canViewAllManufacturers,
      canViewArchived,
      canViewInactive,
      enforceActiveOnly: !canViewInactive,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate manufacturer visibility access control',
      { context, userId: user?.id }
    );
    
    throw AppError.businessError(
      'Unable to evaluate manufacturer visibility access control.'
    );
  }
};

/**
 * Resolves which manufacturer lookup search capabilities the requesting
 * user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<ManufacturerLookupSearchAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateManufacturerLookupSearchCapabilities = async (user) => {
  const context = `${CONTEXT}/evaluateManufacturerLookupSearchCapabilities`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    return {
      canSearchStatus:
        isRoot ||
        permissions.includes(
          MANUFACTURER_CONSTANTS.PERMISSIONS.SEARCH_MANUFACTURERS_BY_STATUS
        ),
      canSearchLocation:
        isRoot ||
        permissions.includes(
          MANUFACTURER_CONSTANTS.PERMISSIONS.SEARCH_MANUFACTURERS_BY_LOCATION
        ),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate manufacturer lookup search capabilities',
      { context, userId: user?.id }
    );
    
    throw AppError.businessError(
      'Unable to evaluate manufacturer lookup search capabilities.'
    );
  }
};

/**
 * Enriches a manufacturer lookup row with a derived `isActive` boolean flag.
 *
 * @param {object} row - Raw manufacturer row from the repository.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object & { isActive: boolean }}
 */
const enrichManufacturerLookupWithActiveFlag = (row, activeStatusId) =>
  enrichWithActiveFlag(row, activeStatusId);

module.exports = {
  evaluateManufacturerVisibilityAccessControl,
  evaluateManufacturerLookupSearchCapabilities,
  enrichManufacturerLookupWithActiveFlag,
};

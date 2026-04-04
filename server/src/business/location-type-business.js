/**
 * @file location-type-business.js
 * @description Domain business logic for location type visibility access
 * control evaluation, lookup search capability resolution, and row enrichment.
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const {
  LOCATION_TYPE_CONSTANTS,
} = require('../utils/constants/domain/location-type-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const { enrichWithActiveFlag } = require('./lookup-visibility');

const CONTEXT = 'location-type-business';

/**
 * Resolves which location type visibility capabilities the requesting user holds.
 *
 * `canViewAllLocationTypes` is a full override — it implies inactive visibility.
 * `enforceActiveOnly` is the default — lifted only when the user can view inactive
 * location types.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<LocationTypeVisibilityAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateLocationTypeVisibilityAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateLocationTypeVisibilityAccessControl`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    const canViewAllLocationTypes =
      isRoot ||
      permissions.includes(
        LOCATION_TYPE_CONSTANTS.PERMISSIONS.VIEW_ALL_LOCATION_TYPES_VISIBILITY
      );
    
    const canViewInactive =
      canViewAllLocationTypes ||
      permissions.includes(
        LOCATION_TYPE_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_LOCATION_TYPES
      );
    
    return {
      canViewAllLocationTypes,
      canViewInactive,
      enforceActiveOnly: !canViewInactive,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate location type visibility access control',
      { context, userId: user?.id }
    );
    
    throw AppError.businessError(
      'Unable to evaluate location type visibility access control.'
    );
  }
};

/**
 * Resolves which location type lookup search capabilities the requesting
 * user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<LocationTypeLookupSearchAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateLocationTypeLookupSearchCapabilities = async (user) => {
  const context = `${CONTEXT}/evaluateLocationTypeLookupSearchCapabilities`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    return {
      canSearchStatus:
        isRoot ||
        permissions.includes(
          LOCATION_TYPE_CONSTANTS.PERMISSIONS.SEARCH_LOCATION_TYPES_BY_STATUS
        ),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate location type lookup search capabilities',
      { context, userId: user?.id }
    );
    
    throw AppError.businessError(
      'Unable to evaluate location type lookup search capabilities.'
    );
  }
};

/**
 * Enriches a location type lookup row with a derived `isActive` boolean flag.
 *
 * @param {object} row - Raw location type row from the repository.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object & { isActive: boolean }}
 */
const enrichLocationTypeLookupWithActiveFlag = (row, activeStatusId) =>
  enrichWithActiveFlag(row, activeStatusId);

module.exports = {
  evaluateLocationTypeVisibilityAccessControl,
  evaluateLocationTypeLookupSearchCapabilities,
  enrichLocationTypeLookupWithActiveFlag,
};

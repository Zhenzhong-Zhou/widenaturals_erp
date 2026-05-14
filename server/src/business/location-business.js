/**
 * @file location-business.js
 * @description Business logic layer for location lookup access control
 * and lookup-row decoration.
 *
 * Owns ACL evaluation, visibility rule enforcement, and active/archived
 * flag normalisation for the location lookup endpoint. Contains no
 * orchestration; the service layer owns query execution, transformation,
 * and cache resolution.
 *
 * Base read access (VIEW_LOCATION_LOOKUP) is enforced by route-level
 * authorize middleware. This layer only resolves scope-level flags and
 * applies the filter shaping they imply.
 *
 * Exports:
 *  - evaluateLocationLookupVisibility  — ACL for the lookup endpoint
 *  - resolveLocationLookupFilters      — pins active status and excludes archived for restricted callers
 *  - enrichLocationLookupRow           — decorates a lookup row with isActive and isArchived flags
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const {
  LOCATION_CONSTANTS,
} = require('../utils/constants/domain/location-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');

const CONTEXT = 'location-business';

/**
 * Resolves the ACL for the location lookup endpoint.
 *
 * Returns two scope flags consumed downstream by the lookup workflow:
 *  - `canViewInactive` — true for root or holders of VIEW_ALL_STATUSES;
 *    bypasses the active-status pin in the resolver and enables the
 *    transformer to surface (and tag) inactive rows.
 *  - `canViewArchived` — true for root or holders of VIEW_ARCHIVED;
 *    bypasses the `includeArchived=false` pin and surfaces archived rows
 *    with the `isArchived` tag.
 *
 * The two flags are independent — admins can hold one without the other.
 *
 * Throws AppError.businessError if permission resolution fails.
 *
 * @param {Object} user - Authenticated user from req.auth.user.
 * @returns {Promise<LocationLookupAcl>}
 */
const evaluateLocationLookupVisibility = async (user) => {
  const context = `${CONTEXT}/evaluateLocationLookupVisibility`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    return {
      canViewInactive:
        isRoot ||
        permissions.includes(LOCATION_CONSTANTS.PERMISSIONS.VIEW_ALL_STATUSES),
      canViewArchived:
        isRoot ||
        permissions.includes(LOCATION_CONSTANTS.PERMISSIONS.VIEW_ARCHIVED),
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate location lookup visibility', {
      context,
      userId: user?.id,
    });
    throw AppError.businessError(
      'Unable to evaluate location lookup visibility.'
    );
  }
};

/**
 * Applies locations lookup ACL to caller-supplied filters.
 *
 * Pure function — no side effects on inputs. Two independent pins:
 *  - Without `canViewInactive`, `statusId` is forced to the supplied
 *    active id, overriding any caller-supplied value.
 *  - Without `canViewArchived`, `includeArchived` is forced to `false`,
 *    overriding any caller-supplied value.
 *
 * Privileged callers retain whatever the caller passed in.
 *
 * @param {LocationFilters}   filters
 * @param {LocationLookupAcl} acl
 * @param {string}            activeStatusId - Cached id for the active status (resolved by the service).
 * @returns {LocationFilters}
 */
const resolveLocationLookupFilters = (filters, acl, activeStatusId) => {
  const next = { ...filters };
  if (!acl.canViewInactive) next.statusId = activeStatusId;
  if (!acl.canViewArchived) next.includeArchived = false;
  return next;
};

/**
 * Decorates a location lookup row with normalised `isActive` and
 * `isArchived` boolean flags.
 *
 * `isActive` is computed by comparing `status_id` against the cached
 * active status id. `isArchived` is a passthrough of the boolean
 * `is_archived` column with explicit casting.
 *
 * @param {LocationLookupRow} row
 * @param {string}            activeStatusId - Cached id for the active status (resolved by the service).
 * @returns {LocationLookupRow & { isActive: boolean, isArchived: boolean }}
 */
const enrichLocationLookupRow = (row, activeStatusId) => ({
  ...row,
  isActive: row.status_id === activeStatusId,
  isArchived: Boolean(row.is_archived),
});

module.exports = {
  evaluateLocationLookupVisibility,
  resolveLocationLookupFilters,
  enrichLocationLookupRow,
};

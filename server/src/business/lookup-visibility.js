/**
 * @file lookup-visibility.js
 * @description Pure utility for applying ACL-driven visibility rules to lookup
 * filter objects. Determines whether archived records are included and whether
 * active-only enforcement is applied, based on the caller-supplied ACL flags.
 */

'use strict';

/**
 * @typedef {object} LookupVisibilityOptions
 * @property {object} filters - The base filter object to adjust.
 * @property {object} acl - ACL flag map for the requesting user.
 * @property {boolean} [acl.canViewArchived] - Whether the user can see archived records.
 * @property {boolean} [acl.enforceActiveOnly] - Whether the user is restricted to active records only.
 * @property {string} activeStatusId - UUID of the active status record, injected when enforcing active-only.
 * @property {string} fullVisibilityKey - Key on `acl` that grants unrestricted visibility (e.g. `'canViewAll'`).
 */

/**
 * Applies ACL-driven visibility rules to a lookup filter object.
 *
 * Three possible outcomes:
 * - Full visibility (`acl[fullVisibilityKey]` is true): archived records
 *   included, active-only enforcement removed, status filter left intact.
 * - Restricted, archive-visible (`acl.canViewArchived` is true): archived
 *   records included, no active-only enforcement.
 * - Restricted, active-only (`acl.enforceActiveOnly` is true): `statusIds`
 *   removed and replaced with `activeStatusId` to hard-pin the status filter.
 *
 * @param {LookupVisibilityOptions} options
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const applyLookupVisibilityRules = ({
  filters,
  acl,
  activeStatusId,
  fullVisibilityKey,
}) => {
  const adjusted = { ...filters };

  // ---------------------------------------------------------
  // Full visibility override
  // ---------------------------------------------------------
  if (acl[fullVisibilityKey]) {
    adjusted.includeArchived = true;
    delete adjusted.enforceActiveOnly;
    delete adjusted.activeStatusId;
    return adjusted;
  }

  // ---------------------------------------------------------
  // Archive visibility
  // ---------------------------------------------------------
  adjusted.includeArchived = !!acl.canViewArchived;

  // ---------------------------------------------------------
  // Active-only enforcement
  // ---------------------------------------------------------
  if (acl.enforceActiveOnly) {
    adjusted.enforceActiveOnly = true;
    adjusted.activeStatusId = activeStatusId;
    // Remove caller-supplied statusIds — active status is now pinned by the
    // repository via activeStatusId, so a loose statusIds filter would conflict.
    delete adjusted.statusIds;
  } else {
    delete adjusted.enforceActiveOnly;
    delete adjusted.activeStatusId;
  }

  return adjusted;
};

/**
 * Applies active-only visibility rules to a lookup filter object.
 *
 * Restricted users are pinned to the active status via `status_id` and
 * `_activeStatusId`. Elevated users have those constraints removed.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {{ canViewAllStatuses: boolean }} userAccess
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object}
 */
const enforceActiveOnlyVisibilityRules = (
  filters,
  userAccess,
  activeStatusId
) => {
  const adjusted = { ...filters };

  if (!userAccess.canViewAllStatuses) {
    adjusted.status_id ??= activeStatusId;
    adjusted._activeStatusId = activeStatusId;
  } else {
    delete adjusted.status_id;
    delete adjusted._activeStatusId;
  }

  return adjusted;
};

/**
 * Enriches a lookup row with a derived `isActive` boolean flag.
 *
 * @param {object} row - Raw row from the repository.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object & { isActive: boolean }}
 */
const enrichWithActiveFlag = (row, activeStatusId) => ({
  ...row,
  isActive: row.status_id === activeStatusId,
});

module.exports = {
  applyLookupVisibilityRules,
  enforceActiveOnlyVisibilityRules,
  enrichWithActiveFlag,
};

/**
 * @file lookup-flag-maps.js
 * @description Shared ACL flag maps for lookup transformers.
 *
 * Maps ACL key names to row property names. Passed as the third argument
 * to `includeFlagsBasedOnAccess` to control which flags are exposed
 * in lookup dropdown output based on the user's access level.
 *
 * Exports:
 *   - STANDARD_FLAG_MAP    – exposes isActive, isValidToday, isArchived
 *   - STATUS_ONLY_FLAG_MAP – exposes isActive only
 */

'use strict';

/**
 * Standard flag map for lookup domains that expose the full set of status flags.
 *
 * @type {FlagMap}
 */
const STANDARD_FLAG_MAP = {
  canViewAllStatuses:     'isActive',
  canViewAllValidLookups: 'isValidToday',
  canViewArchived:        'isArchived',
};

/**
 * Minimal flag map for lookup domains that only expose active/inactive state.
 *
 * @type {FlagMap}
 */
const STATUS_ONLY_FLAG_MAP = {
  canViewAllStatuses: 'isActive',
};

module.exports = {
  STANDARD_FLAG_MAP,
  STATUS_ONLY_FLAG_MAP,
};

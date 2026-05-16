/**
 * @file location.js
 * @description Domain constants for the location module.
 *
 * Exports:
 *  - LOCATION_CONSTANTS — permission keys and other static lookups
 */

'use strict';

const LOCATION_CONSTANTS = {
  PERMISSIONS: {
    // ── Scope ─────────────────────────────────────────────────────────────────

    /**
     * Grants visibility across all locations.
     *
     * Without this, the user may be restricted to locations
     * listed in their assignment record (if location-scoped
     * assignments are introduced for this domain).
     */
    VIEW_ALL: 'view_all_locations',

    // ── Visibility overrides ──────────────────────────────────────────────────

    /** Allows viewing archived locations. */
    VIEW_ARCHIVED: 'view_archived_locations',

    /** Allows viewing locations in any status, not just active. */
    VIEW_ALL_STATUSES: 'view_all_location_statuses',

    // ── Mutations ─────────────────────────────────────────────────────────────

    /** Allows archiving a location record. */
    ARCHIVE: 'archive_location',

    // ── Location types ────────────────────────────────────────────────────────

    /** Allows viewing inactive location types in the location types lookup. */
    VIEW_ALL_LOCATION_TYPES: 'view_all_location_types',
  },
};

module.exports = {
  LOCATION_CONSTANTS,
};

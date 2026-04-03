/**
 * @file location-types.js
 * @description JSDoc typedefs for the location domain.
 *
 * Two categories of types:
 *   - Row types    – raw DB column aliases from repository queries
 *   - Record types – transformed UI-facing shapes
 */

'use strict';

// ---------------------------------------------------------------------------
// Row types (raw DB shapes)
// ---------------------------------------------------------------------------

/**
 * Raw DB row returned by the paginated location query.
 *
 * @typedef {Object} LocationRow
 * @property {string}       id
 * @property {string}       name
 * @property {string|null}  location_type_name
 * @property {string|null}  city
 * @property {string|null}  province_or_state
 * @property {string|null}  country
 * @property {boolean|null} is_archived
 * @property {string|null}  status_id
 * @property {string|null}  status_name
 * @property {string|null}  status_date
 * @property {string|null}  created_at
 * @property {string|null}  updated_at
 * @property {string|null}  created_by
 * @property {string|null}  created_by_firstname
 * @property {string|null}  created_by_lastname
 * @property {string|null}  updated_by
 * @property {string|null}  updated_by_firstname
 * @property {string|null}  updated_by_lastname
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * Transformed location record for paginated table view.
 *
 * @typedef {Object} LocationRecord
 * @property {string}       id
 * @property {string}       name
 * @property {string|null}  locationType
 * @property {{ city: string|null, provinceOrState: string|null, country: string|null }} address
 * @property {boolean}      isArchived
 * @property {{ id: string|null, name: string|null, date: string|null }} status
 * @property {Object}       audit
 */

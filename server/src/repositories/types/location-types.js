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

/**
 * Filter input for locations queries.
 *
 * @typedef {Object} LocationFilters
 * @property {boolean}  [includeArchived]  - Opt-in to include archived rows. Pinned to false by the business resolver for restricted callers.
 * @property {string}   [statusId]         - Single status UUID. Pinned to the active status by the resolver for restricted callers.
 * @property {string[]} [statusIds]        - Multi-status filter; takes precedence over statusId when both are set.
 * @property {string}   [locationTypeId]   - Single location_type UUID.
 * @property {string[]} [locationTypeIds]  - Multi-type filter; takes precedence over locationTypeId.
 * @property {string}   [city]
 * @property {string}   [provinceOrState]
 * @property {string}   [country]
 * @property {string}   [keyword]          - ILIKE search across name + address fields.
 * @property {string}   [createdAfter]
 * @property {string}   [createdBefore]
 * @property {string}   [updatedAfter]
 * @property {string}   [updatedBefore]
 * @property {string}   [createdBy]
 * @property {string}   [updatedBy]
 */

/**
 * Raw row returned by getLocationLookup.
 *
 * @typedef {Object} LocationLookupRow
 * @property {string}  id
 * @property {string}  name
 * @property {string}  city
 * @property {string}  country
 * @property {boolean} is_archived
 * @property {string}  status_id
 */


/**
 * @file location-type-types.js
 * @description JSDoc typedefs for the location type domain.
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
 * Raw DB row returned by paginated and detail location type queries.
 *
 * @typedef {Object} LocationTypeRow
 * @property {string}      id
 * @property {string}      code
 * @property {string}      name
 * @property {string|null} description
 * @property {string|null} status_id
 * @property {string|null} status_name
 * @property {string|null} status_date
 * @property {string|null} created_at
 * @property {string|null} updated_at
 * @property {string|null} created_by
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 * @property {string|null} updated_by
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * Transformed location type record — shared shape for both table and detail views.
 *
 * @typedef {Object} LocationTypeRecord
 * @property {string}      id
 * @property {string}      code
 * @property {string}      name
 * @property {string|null} description
 * @property {{ id: string|null, name: string|null, date: string|null }} status
 * @property {Object}      audit
 */

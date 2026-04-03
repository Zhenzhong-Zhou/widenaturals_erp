/**
 * @file order-type-types.js
 * @description JSDoc typedefs for the order type domain.
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
 * Raw DB row returned by the paginated order type query.
 *
 * @typedef {Object} OrderTypeRow
 * @property {string}      id
 * @property {string}      name
 * @property {string}      code
 * @property {string|null} category
 * @property {boolean}     requires_payment
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
 * Transformed order type record for paginated table view.
 *
 * @typedef {Object} OrderTypeRecord
 * @property {string}      id
 * @property {string}      name
 * @property {string}      code
 * @property {string|null} category
 * @property {boolean}     requiresPayment
 * @property {{ id: string|null, name: string|null, date: string|null }} status
 * @property {Object}      audit
 */

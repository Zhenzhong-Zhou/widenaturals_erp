/**
 * @file product-types.js
 * @description JSDoc typedefs for the product domain.
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
 * Raw DB row returned by paginated and detail product queries.
 *
 * @typedef {Object} ProductRow
 * @property {string}      id
 * @property {string}      name
 * @property {string|null} series
 * @property {string|null} brand
 * @property {string|null} category
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

/**
 * Raw DB row returned by the product bulk insert query.
 *
 * @typedef {Object} ProductInsertRow
 * @property {string} id
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * Transformed product record for paginated table view.
 *
 * @typedef {Object} ProductRecord
 * @property {string}      id
 * @property {string}      name
 * @property {string|null} series
 * @property {string|null} brand
 * @property {string|null} category
 * @property {{ id: string|null, name: string|null, date: string|null }} status
 * @property {Object}      audit
 */

/**
 * Transformed product detail record — extends `ProductRecord` with description.
 *
 * @typedef {Object} ProductDetailRecord
 * @property {string}      id
 * @property {string}      name
 * @property {string|null} series
 * @property {string|null} brand
 * @property {string|null} category
 * @property {string|null} description
 * @property {{ id: string|null, name: string|null, date: string|null }} status
 * @property {Object}      audit
 */

/**
 * Transformed product insert result — ID-only shape.
 *
 * @typedef {Object} ProductInsertRecord
 * @property {string} id
 */

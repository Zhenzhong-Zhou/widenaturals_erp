/**
 * @file types/pricing-type-types.js
 * @description JSDoc typedefs for the pricing type domain.
 *
 * Two categories of types:
 *   - Row types    — raw DB column aliases from repository queries
 *   - Record types — transformed UI-facing shapes
 */

'use strict';

// ─── Row Types ────────────────────────────────────────────────────────────────

/**
 * Raw DB row returned by buildPricingTypePaginatedQuery.
 *
 * @typedef {Object} PricingTypeRow
 * @property {string}      id
 * @property {string}      name
 * @property {string}      code
 * @property {string|null} slug
 * @property {string|null} description
 * @property {string}      status_id
 * @property {string}      status_name
 * @property {Date}        status_date
 * @property {Date}        created_at
 * @property {Date}        updated_at
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 */

// ─── Record Types ─────────────────────────────────────────────────────────────

/**
 * Transformed pricing type record for paginated table and detail view.
 *
 * @typedef {Object} PricingTypeRecord
 * @property {string}        id
 * @property {string}        name
 * @property {string}        code
 * @property {string|null}   slug
 * @property {string|null}   description
 * @property {NormalizedStatus} status
 * @property {AuditMeta}  audit
 */

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

/**
 * Raw DB row returned by PRICING_TYPE_GET_BY_ID_QUERY.
 *
 * @typedef {Object} PricingTypeDetailRow
 * @property {string}      pricing_type_id
 * @property {string}      pricing_type_name
 * @property {string}      pricing_type_code
 * @property {string|null} pricing_type_slug
 * @property {string|null} pricing_type_description
 * @property {string}      status_id
 * @property {string}      status_name
 * @property {Date}        status_date
 * @property {Date}        pricing_type_created_at
 * @property {Date}        pricing_type_updated_at
 * @property {string|null} created_by_id
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 * @property {string|null} updated_by_id
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 */

// ─── Record Types ─────────────────────────────────────────────────────────────

/**
 * Transformed pricing type record for paginated table view.
 *
 * @typedef {Object} PricingTypeRecord
 * @property {string}      id
 * @property {string}      name
 * @property {string}      code
 * @property {string|null} slug
 * @property {string|null} description
 * @property {string}      statusId
 * @property {string}      statusName
 * @property {string}      statusDate
 * @property {string}      createdAt
 * @property {string}      updatedAt
 * @property {string|null} createdByFirstname
 * @property {string|null} createdByLastname
 * @property {string|null} updatedByFirstname
 * @property {string|null} updatedByLastname
 */

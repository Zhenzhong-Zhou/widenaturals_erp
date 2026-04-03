/**
 * @file pricing-type-types.js
 * @description JSDoc typedefs for the pricing type domain.
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
 * Raw DB row returned by the paginated pricing type query.
 *
 * @typedef {Object} PricingTypeRow
 * @property {string}      id
 * @property {string}      name
 * @property {string}      code
 * @property {string|null} slug
 * @property {string|null} description
 * @property {string|null} status
 * @property {string|null} status_date
 * @property {string|null} created_at
 * @property {string|null} updated_at
 * @property {string|null} created_by_fullname
 * @property {string|null} updated_by_fullname
 */

/**
 * Raw DB row returned by the pricing type detail query (`getPricingTypeById`).
 *
 * @typedef {Object} PricingTypeDetailRow
 * @property {string}      pricing_type_id
 * @property {string}      pricing_type_name
 * @property {string}      pricing_type_code
 * @property {string|null} pricing_type_slug
 * @property {string|null} pricing_type_description
 * @property {string|null} status_id
 * @property {string|null} status_name
 * @property {string|null} status_date
 * @property {string|null} created_by_id
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 * @property {string|null} updated_by_id
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 * @property {string|null} pricing_type_created_at
 * @property {string|null} pricing_type_updated_at
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * Transformed pricing type record for paginated table view.
 *
 * @typedef {Object} PricingTypeRecord
 * @property {string}      id
 * @property {string}      name
 * @property {string}      code
 * @property {string|null} slug
 * @property {string|null} description
 * @property {string|null} status
 * @property {string|null} statusDate
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 * @property {string|null} createdByFullName
 * @property {string|null} updatedByFullName
 */

/**
 * Transformed pricing type detail record.
 *
 * @typedef {Object} PricingTypeDetailRecord
 * @property {string}      id
 * @property {string}      name
 * @property {string}      code
 * @property {string|null} slug
 * @property {string|null} description
 * @property {{ id: string|null, name: string|null, date: string|null }} status
 * @property {{ id: string|null, fullName: string|null }} createdBy
 * @property {{ id: string|null, fullName: string|null }} updatedBy
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 */

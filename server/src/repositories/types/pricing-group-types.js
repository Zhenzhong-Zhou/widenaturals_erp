/**
 * @file types/pricing-group-types.js
 * @description JSDoc typedefs for the pricing group domain.
 *
 * Two categories of types:
 *   - Row types    — raw DB column aliases from repository queries
 *   - Record types — transformed UI-facing shapes
 */

'use strict';

// ─── Row Types ────────────────────────────────────────────────────────────────

/**
 * Raw DB row returned by buildPricingGroupListQuery.
 * Includes aggregated SKU and product counts.
 *
 * @typedef {Object} PricingGroupRow
 * @property {string}      id
 * @property {string}      pricing_type_id
 * @property {string}      pricing_type_name
 * @property {string}      pricing_type_code
 * @property {string|null} country_code
 * @property {string}      price
 * @property {Date}        valid_from
 * @property {Date|null}   valid_to
 * @property {string}      status_id
 * @property {string}      status_name
 * @property {Date}        status_date
 * @property {string}      sku_count
 * @property {string}      product_count
 * @property {Date}        updated_at
 */

/**
 * Raw DB row returned by PRICING_GROUP_BY_ID_QUERY.
 * Full detail with audit fields.
 *
 * @typedef {Object} PricingGroupDetailRow
 * @property {string}      id
 * @property {string}      pricing_type_id
 * @property {string}      pricing_type_name
 * @property {string}      pricing_type_code
 * @property {string|null} country_code
 * @property {string}      price
 * @property {Date}        valid_from
 * @property {Date|null}   valid_to
 * @property {string}      status_id
 * @property {string}      status_name
 * @property {Date}        status_date
 * @property {Date}        created_at
 * @property {Date}        updated_at
 * @property {string|null} created_by
 * @property {string|null} updated_by
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 */

// ─── Record Types ─────────────────────────────────────────────────────────────

/**
 * Transformed pricing group record for paginated list view.
 *
 * @typedef {Object} PricingGroupRecord
 * @property {string}      id
 * @property {string}      pricingTypeId
 * @property {string}      pricingTypeName
 * @property {string}      pricingTypeCode
 * @property {string|null} countryCode
 * @property {number}      price
 * @property {string}      validFrom
 * @property {string|null} validTo
 * @property {string}      statusId
 * @property {string}      statusName
 * @property {string}      statusDate
 * @property {number}      skuCount
 * @property {number}      productCount
 * @property {string}      updatedAt
 */

/**
 * Transformed pricing group detail record for single record view.
 *
 * @typedef {Object} PricingGroupDetailRecord
 * @property {string}      id
 * @property {string}      pricingTypeId
 * @property {string}      pricingTypeName
 * @property {string}      pricingTypeCode
 * @property {string|null} countryCode
 * @property {number}      price
 * @property {string}      validFrom
 * @property {string|null} validTo
 * @property {string}      statusId
 * @property {string}      statusName
 * @property {string}      statusDate
 * @property {string}      createdAt
 * @property {string}      updatedAt
 * @property {string|null} createdBy
 * @property {string|null} updatedBy
 * @property {string|null} createdByFirstname
 * @property {string|null} createdByLastname
 * @property {string|null} updatedByFirstname
 * @property {string|null} updatedByLastname
 */

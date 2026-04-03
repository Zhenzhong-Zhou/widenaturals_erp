/**
 * @file pricing-types.js
 * @description JSDoc typedefs for the pricing domain.
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
 * Raw DB row returned by the paginated pricing list query.
 *
 * @typedef {Object} PricingListRow
 * @property {string}      pricing_id
 * @property {number|null} price
 * @property {string|null} valid_from
 * @property {string|null} valid_to
 * @property {string}      pricing_type_id
 * @property {string}      pricing_type
 * @property {string|null} pricing_type_code
 * @property {string|null} pricing_type_slug
 * @property {string}      sku_id
 * @property {string}      sku
 * @property {string|null} country_code
 * @property {string|null} size_label
 * @property {string|null} barcode
 * @property {string}      product_id
 * @property {string}      product_name
 * @property {string|null} brand
 */

/**
 * Raw DB row returned by the pricing detail query (`getPricingDetailsByPricingTypeId`).
 *
 * @typedef {Object} PricingDetailRow
 * @property {string}      pricing_type
 * @property {string|null} location_id
 * @property {string|null} location_name
 * @property {number|null} price
 * @property {string|null} valid_from
 * @property {string|null} valid_to
 * @property {string|null} pricing_status_id
 * @property {string|null} pricing_status_name
 * @property {string|null} pricing_created_at
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 * @property {string|null} pricing_updated_at
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 * @property {string|null} sku
 * @property {string|null} barcode
 * @property {string|null} country_code
 * @property {string|null} size_label
 * @property {string|null} product_name
 * @property {string|null} brand_name
 * @property {number|null} product_count
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * Transformed pricing list record for paginated table view.
 *
 * @typedef {Object} PricingListRecord
 * @property {string}      pricingId
 * @property {number|null} price
 * @property {string|null} validFrom
 * @property {string|null} validTo
 * @property {{ id: string, name: string, code: string|null, slug: string|null }} pricingType
 * @property {{ id: string, value: string, countryCode: string|null, sizeLabel: string|null, barcode: string|null }} sku
 * @property {{ id: string, name: string, brand: string|null }} product
 */

/**
 * Transformed pricing detail record.
 *
 * @typedef {Object} PricingDetailRecord
 * @property {{ name: string }} pricingType
 * @property {{
 *   locationId: string|null,
 *   locationName: string|null,
 *   price: number|null,
 *   validFrom: string|null,
 *   validTo: string|null,
 *   status: { id: string|null, name: string|null },
 *   createdAt: string|null,
 *   createdBy: { fullName: string|null },
 *   updatedAt: string|null,
 *   updatedBy: { fullName: string|null }
 * }} pricing
 * @property {{ sku: string|null, barcode: string|null, countryCode: string|null, sizeLabel: string|null }} sku
 * @property {{ productName: string|null, brand: string|null }} product
 * @property {number|undefined} productCount
 */

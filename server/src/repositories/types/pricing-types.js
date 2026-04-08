/**
 * @file types/pricing-types.js
 * @description JSDoc typedefs for the pricing domain.
 *
 * Two categories of types:
 *   - Row types    — raw DB column aliases from repository queries
 *   - Record types — transformed UI-facing shapes
 */

'use strict';

// ─── Row Types ────────────────────────────────────────────────────────────────

/**
 * Raw DB row returned by buildPricingSkuListQuery.
 * Used for paginated SKU list, filtered search, and export.
 *
 * @typedef {Object} PricingSkuRow
 * @property {string}      pricing_id
 * @property {string}      pricing_group_id
 * @property {string}      pricing_type_id
 * @property {string}      pricing_type_name
 * @property {string}      pricing_type_code
 * @property {string|null} country_code
 * @property {string}      price
 * @property {Date}        valid_from
 * @property {Date|null}   valid_to
 * @property {string}      status_id
 * @property {string}      status_name
 * @property {string}      sku_id
 * @property {string}      sku
 * @property {string}      barcode
 * @property {string|null} size_label
 * @property {string|null} sku_country_code
 * @property {string}      product_id
 * @property {string}      product_name
 * @property {string|null} brand
 * @property {string|null} category
 */

/**
 * Raw DB row returned by PRICING_BY_SKU_QUERY.
 * Returns all pricing groups a SKU belongs to with full audit fields.
 *
 * @typedef {Object} PricingBySkuRow
 * @property {string}      pricing_id
 * @property {string}      sku_id
 * @property {string}      pricing_group_id
 * @property {string}      pricing_type_id
 * @property {string}      price_type_name
 * @property {string}      price_type_code
 * @property {string|null} country_code
 * @property {string}      price
 * @property {Date}        valid_from
 * @property {Date|null}   valid_to
 * @property {string}      status_id
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

/**
 * Raw DB row returned by PRICING_BY_GROUP_AND_SKU_BATCH_QUERY.
 * Used internally for order price resolution — never transformed for UI.
 *
 * @typedef {Object} PricingBatchRow
 * @property {string} pricing_group_id
 * @property {string} sku_id
 * @property {string} price
 */

// ─── Record Types ─────────────────────────────────────────────────────────────

/**
 * Transformed SKU-level pricing record for paginated table and export.
 *
 * @typedef {Object} PricingSkuFlatRecord
 * @property {string}      pricingId
 * @property {string}      pricingGroupId
 * @property {string}      pricingTypeId
 * @property {string}      pricingTypeName
 * @property {string}      pricingTypeCode
 * @property {string|null} countryCode
 * @property {number}      price
 * @property {string}      validFrom
 * @property {string|null} validTo
 * @property {string}      statusId
 * @property {string}      statusName
 * @property {string}      skuId
 * @property {string}      sku
 * @property {string}      barcode
 * @property {string|null} sizeLabel
 * @property {string|null} skuCountryCode
 * @property {string}      productId
 * @property {string}      productName
 * @property {string|null} brand
 * @property {string|null} category
 */

/**
 * Transformed record for all pricing groups a SKU belongs to.
 *
 * @typedef {Object} PricingBySkuRecord
 * @property {string}      pricingId
 * @property {string}      skuId
 * @property {string}      pricingGroupId
 * @property {string}      pricingTypeId
 * @property {string}      priceTypeName
 * @property {string}      priceTypeCode
 * @property {string|null} countryCode
 * @property {number}      price
 * @property {string}      validFrom
 * @property {string|null} validTo
 * @property {string}      statusId
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

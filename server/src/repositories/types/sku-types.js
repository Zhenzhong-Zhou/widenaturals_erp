/**
 * @file sku-types.js
 * @description JSDoc typedefs for the SKU domain.
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
 * Raw DB row returned by the paginated SKU product card query.
 *
 * @typedef {Object} SkuProductCardRow
 * @property {string}      sku_id
 * @property {string}      sku_code
 * @property {string|null} barcode
 * @property {string|null} product_name
 * @property {string|null} brand
 * @property {string|null} series
 * @property {string|null} category
 * @property {string|null} market_region
 * @property {string|null} product_status_name
 * @property {string|null} sku_status_name
 * @property {string|null} compliance_type
 * @property {string|null} compliance_id
 * @property {number|null} msrp_price
 * @property {string|null} primary_image_url
 * @property {string|null} image_alt_text
 */

/**
 * Raw DB row returned by the paginated SKU list query.
 *
 * @typedef {Object} SkuListRow
 * @property {string}      sku_id
 * @property {string}      product_id
 * @property {string}      sku
 * @property {string|null} barcode
 * @property {string|null} language
 * @property {string|null} country_code
 * @property {string|null} market_region
 * @property {string|null} size_label
 * @property {string|null} primary_image_url
 * @property {string|null} product_name
 * @property {string|null} series
 * @property {string|null} brand
 * @property {string|null} category
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
 * Raw DB row returned by the SKU insert query.
 *
 * @typedef {Object} SkuInsertRow
 * @property {string} id
 */

/**
 * Raw DB row returned by the SKU detail query.
 *
 * @typedef {Object} SkuDetailRow
 * @property {string}      sku_id
 * @property {string}      sku
 * @property {string|null} barcode
 * @property {string|null} sku_description
 * @property {string|null} language
 * @property {string|null} size_label
 * @property {string|null} country_code
 * @property {string|null} market_region
 * @property {string|null} display_name
 * @property {string}      product_id
 * @property {string|null} product_name
 * @property {string|null} product_series
 * @property {string|null} product_brand
 * @property {string|null} product_category
 * @property {string|null} brand
 * @property {string|null} sku_code
 * @property {number|null} length_cm
 * @property {number|null} width_cm
 * @property {number|null} height_cm
 * @property {number|null} length_inch
 * @property {number|null} width_inch
 * @property {number|null} height_inch
 * @property {number|null} weight_g
 * @property {number|null} weight_lb
 * @property {string|null} sku_status_id
 * @property {string|null} sku_status_name
 * @property {string|null} sku_status_date
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
 * Transformed SKU insert result.
 *
 * @typedef {Object} SkuInsertRecord
 * @property {string}      id
 * @property {string|null} skuCode
 */

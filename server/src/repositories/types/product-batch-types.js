/**
 * @file product-batch-types.js
 * @description JSDoc typedefs for the product batch domain.
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
 * Raw DB row returned by the paginated product batch query.
 *
 * @typedef {Object} ProductBatchRow
 * @property {string}       id
 * @property {string}       lot_number
 * @property {string|null}  sku_id
 * @property {string|null}  sku_code
 * @property {string|null}  size_label
 * @property {string|null}  country_code
 * @property {string|null}  product_id
 * @property {string|null}  product_name
 * @property {string|null}  brand
 * @property {string|null}  category
 * @property {string|null}  manufacturer_id
 * @property {string|null}  manufacturer_name
 * @property {string|null}  manufacture_date
 * @property {string|null}  expiry_date
 * @property {string|null}  received_date
 * @property {number|null}  initial_quantity
 * @property {string|null}  status_id
 * @property {string|null}  status_name
 * @property {string|null}  status_date
 * @property {string|null}  released_at
 * @property {string|null}  released_by_id
 * @property {string|null}  released_by_firstname
 * @property {string|null}  released_by_lastname
 * @property {string|null}  created_at
 * @property {string|null}  updated_at
 * @property {string|null}  created_by
 * @property {string|null}  created_by_firstname
 * @property {string|null}  created_by_lastname
 * @property {string|null}  updated_by
 * @property {string|null}  updated_by_firstname
 * @property {string|null}  updated_by_lastname
 */

/**
 * Raw DB row returned by the product batch insert query.
 *
 * @typedef {Object} ProductBatchInsertRow
 * @property {string}      id
 * @property {string}      lot_number
 * @property {string}      sku_id
 * @property {string|null} manufacture_date
 * @property {string|null} expiry_date
 * @property {number}      initial_quantity
 * @property {string}      status_id
 */

/**
 * Raw DB row returned by the product batch detail query.
 *
 * @typedef {Object} ProductBatchDetailRow
 * @property {string}       id
 * @property {string}       lot_number
 * @property {number|null}  initial_quantity
 * @property {string|null}  manufacture_date
 * @property {string|null}  expiry_date
 * @property {string|null}  received_at
 * @property {string|null}  released_at
 * @property {string|null}  notes
 * @property {string|null}  batch_status_id
 * @property {string|null}  batch_status_name
 * @property {string|null}  status_date
 * @property {string|null}  sku_id
 * @property {string|null}  sku
 * @property {string|null}  barcode
 * @property {string|null}  size_label
 * @property {string|null}  market_region
 * @property {string|null}  sku_status_id
 * @property {string|null}  sku_status_name
 * @property {string|null}  product_id
 * @property {string|null}  product_name
 * @property {string|null}  brand
 * @property {string|null}  category
 * @property {string|null}  product_status_id
 * @property {string|null}  product_status_name
 * @property {string|null}  manufacturer_id
 * @property {string|null}  manufacturer_name
 * @property {string|null}  manufacturer_status_id
 * @property {string|null}  manufacturer_status_name
 * @property {string|null}  received_by_id
 * @property {string|null}  received_by_firstname
 * @property {string|null}  received_by_lastname
 * @property {string|null}  released_by_id
 * @property {string|null}  released_by_firstname
 * @property {string|null}  released_by_lastname
 * @property {string|null}  created_at
 * @property {string|null}  updated_at
 * @property {string|null}  created_by
 * @property {string|null}  created_by_firstname
 * @property {string|null}  created_by_lastname
 * @property {string|null}  updated_by
 * @property {string|null}  updated_by_firstname
 * @property {string|null}  updated_by_lastname
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * Transformed product batch insert result.
 *
 * @typedef {Object} ProductBatchInsertRecord
 * @property {string}      id
 * @property {string}      lotNumber
 * @property {string}      skuId
 * @property {string|null} manufactureDate
 * @property {string|null} expiryDate
 * @property {number}      initialQuantity
 * @property {string}      statusId
 */

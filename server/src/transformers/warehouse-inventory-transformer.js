/**
 * @file warehouse-inventory-transformer.js
 * @description Row-to-record transformers for warehouse inventory queries.
 *
 * Pure functions — no logging, no errors, no side effects.
 *
 * Exports:
 *  - transformWarehouseInventoryRecord
 *  - transformPaginatedWarehouseInventory
 */

'use strict';

const { getProductDisplayName } = require('../utils/display-name-utils');
const { cleanObject } = require('../utils/object-utils');
const {
  transformInventoryRecordSummaryBase,
} = require('./transform-inventory-record-base');
const { makeStatus } = require('../utils/status-utils');
const { transformPageResult } = require('../utils/transformer-utils');

/**
 * Transforms a raw warehouse inventory DB row into a structured API record.
 *
 * @param {WarehouseInventoryRow} row
 * @returns {WarehouseInventoryRecord}
 */
const transformWarehouseInventoryRecord = (row) => ({
  id:                row.id,
  batchId:           row.batch_id,
  batchType:         row.batch_type,
  warehouseQuantity: row.warehouse_quantity,
  reservedQuantity:  row.reserved_quantity,
  availableQuantity: row.available_quantity,
  warehouseFee:      row.warehouse_fee,
  inboundDate:       row.inbound_date,
  outboundDate:      row.outbound_date,
  lastMovementAt:    row.last_movement_at,
  
  status: makeStatus(row),
  
  productInfo: cleanObject({
    batch: cleanObject({
      id:         row.product_batch_id,
      lotNumber:  row.product_lot_number,
      expiryDate: row.product_expiry_date,
    }),
    sku: cleanObject({
      id:           row.sku_id,
      sku:          row.sku,
      barcode:      row.barcode,
      sizeLabel:    row.size_label,
      countryCode:  row.country_code,
      marketRegion: row.market_region,
    }),
    product: cleanObject({
      id:    row.product_id,
      name:  row.product_name,
      brand: row.brand,
    }),
    manufacturer: cleanObject({
      id:   row.manufacturer_id,
      name: row.manufacturer_name,
    }),
  }),
  
  packagingInfo: cleanObject({
    batch: cleanObject({
      id:          row.packaging_batch_id,
      lotNumber:   row.packaging_lot_number,
      displayName: row.packaging_display_name,
      expiryDate:  row.packaging_expiry_date,
    }),
    material: cleanObject({
      id:   row.packaging_material_id,
      code: row.packaging_material_code,
    }),
    supplier: cleanObject({
      id:   row.supplier_id,
      name: row.supplier_name,
    }),
  }),
});

/**
 * @param {PaginatedResult<WarehouseInventoryRow>} paginatedResult
 * @returns {PaginatedResult<WarehouseInventoryRecord>}
 */
const transformPaginatedWarehouseInventory = (paginatedResult) =>
  /** @type {PaginatedResult<WarehouseInventoryRecord>} */ (
  transformPageResult(paginatedResult, transformWarehouseInventoryRecord)
);

/**
 * Transforms a paginated result set of raw warehouse inventory rows into enriched, display-ready objects.
 *
 * This function applies `transformWarehouseInventoryRecord` to each record in the paginated result,
 * converting database field names into structured objects, deriving display names, and attaching status flags.
 *
 * @param {Object} paginatedResult - The raw paginated database result
 * @returns {Object} Transformed a paginated result with structured warehouse inventory data
 */
const transformPaginatedWarehouseInventoryRecordResults = (paginatedResult) =>
  transformPageResult(paginatedResult, transformWarehouseInventoryRecord);

/**
 * Transforms warehouse inventory records into a normalized API response structure.
 *
 * Used after insert or quantity adjustment operations to generate lightweight UI/API responses.
 * Merges product or material info dynamically into unified fields.
 * Cleans out null/undefined values using `cleanObject`.
 *
 * @param {Array<Object>} rows - Raw rows returned from warehouse inventory summary queries.
 * @returns {Array<Object>} - Transformed, clean, and minimal inventory response records.
 */
const transformWarehouseInventoryResponseRecords = (rows) => {
  return transformInventoryRecordSummaryBase(rows, {
    quantityField: 'warehouse_quantity',
    getProductDisplayName,
    cleanObject,
  });
};

module.exports = {
  transformWarehouseInventoryRecord,
  transformPaginatedWarehouseInventory,
  transformPaginatedWarehouseInventoryRecordResults,
  transformWarehouseInventoryResponseRecords,
};

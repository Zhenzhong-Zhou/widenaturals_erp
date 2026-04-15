/**
 * @file warehouse-inventory-transformer.js
 * @description Row-to-record transformers for warehouse inventory queries.
 *
 * Pure functions — no logging, no errors, no side effects.
 *
 * Exports:
 *  - transformWarehouseInventoryRecord          — list view row to record
 *  - transformPaginatedWarehouseInventory       — paginated list transformer
 *  - transformWarehouseInventoryDetailRecord    — detail view row to record
 */

'use strict';

const { cleanObject } = require('../utils/object-utils');
const { makeStatus } = require('../utils/status-utils');
const { transformPageResult } = require('../utils/transformer-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');

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
 * Transforms a raw warehouse inventory detail DB row into a structured API record.
 *
 * @param {WarehouseInventoryDetailRow} row
 * @returns {WarehouseInventoryDetailRecord}
 */
const transformWarehouseInventoryDetailRecord = (row) => ({
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
  registeredAt:      row.registered_at,
  batchNote:         row.batch_note,
  
  status: makeStatus(row),
  
  productInfo: cleanObject({
    batch: cleanObject({
      id:              row.product_batch_id,
      lotNumber:       row.product_lot_number,
      expiryDate:      row.product_expiry_date,
      manufactureDate: row.product_manufacture_date,
      initialQuantity: row.product_initial_quantity,
      notes:           row.product_batch_notes,
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
      id:           row.product_id,
      name:         row.product_name,
      brand:        row.brand,
      category:     row.category,
      series:       row.series,
      displayName:  getProductDisplayName(row),
    }),
    manufacturer: cleanObject({
      id:   row.manufacturer_id,
      name: row.manufacturer_name,
    }),
  }),
  
  packagingInfo: cleanObject({
    batch: cleanObject({
      id:              row.packaging_batch_id,
      lotNumber:       row.packaging_lot_number,
      displayName:     row.packaging_display_name,
      expiryDate:      row.packaging_expiry_date,
      initialQuantity: row.packaging_initial_quantity,
      unit:            row.packaging_unit,
    }),
    material: cleanObject({
      id:       row.packaging_material_id,
      code:     row.packaging_material_code,
      name:     row.packaging_material_name,
      category: row.packaging_material_category,
    }),
    supplier: cleanObject({
      id:   row.supplier_id,
      name: row.supplier_name,
    }),
  }),
  
  audit:       compactAudit(makeAudit(row)),
});

module.exports = {
  transformWarehouseInventoryRecord,
  transformPaginatedWarehouseInventory,
  transformWarehouseInventoryDetailRecord,
};

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
 *  - transformWarehouseSummary                  — warehouse summary row and status rows to record
 *  - transformWarehouseProductSummary           — product summary rows to API records
 *  - transformWarehousePackagingSummary         — packaging summary rows to API records
 *
 * Internal helpers (not exported):
 *  - mapWarehouseInventoryBase — shared base field mapping for all batch types
 *  - buildProductInfo          — product info subtree, returns null when empty
 *  - buildPackagingInfo        — packaging info subtree, returns null when empty
 */

'use strict';

const { cleanObject, cleanOrNull } = require('../utils/object-utils');
const { makeStatus } = require('../utils/status-utils');
const { transformPageResult } = require('../utils/transformer-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');

/**
 * Builds the product info subtree from a warehouse inventory row.
 *
 * Returns null when all product-related fields are null (e.g. when the
 * row represents a packaging_material batch).
 *
 * @param {WarehouseInventoryRow} row
 * @returns {ProductInfo|null}
 */
const buildProductInfo = (row) =>
  cleanOrNull({
    batch: {
      id: row.product_batch_id,
      lotNumber: row.product_lot_number,
      expiryDate: row.product_expiry_date,
    },
    sku: {
      id: row.sku_id,
      sku: row.sku,
      barcode: row.barcode,
      sizeLabel: row.size_label,
      countryCode: row.country_code,
      marketRegion: row.market_region,
    },
    product: {
      id: row.product_id,
      name: row.product_name,
      brand: row.brand,
    },
    manufacturer: {
      id: row.manufacturer_id,
      name: row.manufacturer_name,
    },
  });

/**
 * Builds the packaging info subtree from a warehouse inventory row.
 *
 * Returns null when all packaging-related fields are null (e.g. when the
 * row represents a product batch).
 *
 * @param {WarehouseInventoryRow} row
 * @returns {PackagingInfo|null}
 */
const buildPackagingInfo = (row) =>
  cleanOrNull({
    batch: {
      id: row.packaging_batch_id,
      lotNumber: row.packaging_lot_number,
      displayName: row.packaging_display_name,
      expiryDate: row.packaging_expiry_date,
    },
    material: {
      id: row.packaging_material_id,
      code: row.packaging_material_code,
    },
    supplier: {
      id: row.supplier_id,
      name: row.supplier_name,
    },
  });

/**
 * Maps shared warehouse inventory fields common to all batch types.
 *
 * @param {WarehouseInventoryRow} row
 * @returns {WarehouseInventoryBase}
 */
const mapWarehouseInventoryBase = (row) => ({
  id: row.id,
  batchId: row.batch_id,
  batchType: row.batch_type,
  warehouseQuantity: row.warehouse_quantity,
  reservedQuantity: row.reserved_quantity,
  availableQuantity: row.available_quantity,
  warehouseFee: row.warehouse_fee,
  inboundDate: row.inbound_date,
  outboundDate: row.outbound_date,
  lastMovementAt: row.last_movement_at,
  status: makeStatus(row),
});

/**
 * Transforms a raw warehouse inventory DB row into a structured API record.
 *
 * Branches on batch_type to build the appropriate info subtree — productInfo
 * for product batches, packagingInfo for packaging_material batches. The
 * inactive side is always null, giving the frontend a stable discriminated shape.
 *
 * @param {WarehouseInventoryRow} row
 * @returns {WarehouseInventoryRecord}
 */
const transformWarehouseInventoryRecord = (row) => {
  const base = mapWarehouseInventoryBase(row);

  if (row.batch_type === 'product') {
    return {
      ...base,
      productInfo: buildProductInfo(row),
      packagingInfo: null,
    };
  }

  if (row.batch_type === 'packaging_material') {
    return {
      ...base,
      productInfo: null,
      packagingInfo: buildPackagingInfo(row),
    };
  }

  return {
    ...base,
    productInfo: null,
    packagingInfo: null,
  };
};

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
  id: row.id,
  batchId: row.batch_id,
  batchType: row.batch_type,
  warehouseQuantity: row.warehouse_quantity,
  reservedQuantity: row.reserved_quantity,
  availableQuantity: row.available_quantity,
  warehouseFee: row.warehouse_fee,
  inboundDate: row.inbound_date,
  outboundDate: row.outbound_date,
  lastMovementAt: row.last_movement_at,
  registeredAt: row.registered_at,
  batchNote: row.batch_note,

  status: makeStatus(row),

  productInfo: cleanObject({
    batch: cleanObject({
      id: row.product_batch_id,
      lotNumber: row.product_lot_number,
      expiryDate: row.product_expiry_date,
      manufactureDate: row.product_manufacture_date,
      initialQuantity: row.product_initial_quantity,
      notes: row.product_batch_notes,
    }),
    sku: cleanObject({
      id: row.sku_id,
      sku: row.sku,
      barcode: row.barcode,
      sizeLabel: row.size_label,
      countryCode: row.country_code,
      marketRegion: row.market_region,
    }),
    product: cleanObject({
      id: row.product_id,
      name: row.product_name,
      brand: row.brand,
      category: row.category,
      series: row.series,
      displayName: getProductDisplayName(row),
    }),
    manufacturer: cleanObject({
      id: row.manufacturer_id,
      name: row.manufacturer_name,
    }),
  }),

  packagingInfo: cleanObject({
    batch: cleanObject({
      id: row.packaging_batch_id,
      lotNumber: row.packaging_lot_number,
      displayName: row.packaging_display_name,
      expiryDate: row.packaging_expiry_date,
      initialQuantity: row.packaging_initial_quantity,
      unit: row.packaging_unit,
    }),
    material: cleanObject({
      id: row.packaging_material_id,
      code: row.packaging_material_code,
      name: row.packaging_material_name,
      category: row.packaging_material_category,
    }),
    supplier: cleanObject({
      id: row.supplier_id,
      name: row.supplier_name,
    }),
  }),

  audit: compactAudit(makeAudit(row)),
});

/**
 * Transforms a raw warehouse summary row and status breakdown rows
 * into a structured API record with warehouse info, quantity totals,
 * batch-type breakdown, and per-status breakdown.
 *
 * @param {WarehouseSummaryRow}         row
 * @param {WarehouseSummaryByStatusRow[]} statusRows
 * @returns {object}
 */
const transformWarehouseSummary = (row, statusRows) => ({
  warehouse: {
    id: row.warehouse_id,
    name: row.warehouse_name,
    code: row.warehouse_code,
    storageCapacity: row.storage_capacity,
    defaultFee: row.default_fee,
    typeName: row.warehouse_type_name,
  },

  totals: {
    batches: parseInt(row.total_batches, 10),
    productSkus: parseInt(row.total_product_skus, 10),
    packagingMaterials: parseInt(row.total_packaging_materials, 10),
    quantity: parseInt(row.total_quantity, 10),
    reserved: parseInt(row.total_reserved, 10),
    available: parseInt(row.total_available, 10),
  },

  byBatchType: {
    product: {
      batchCount: parseInt(row.product_batch_count, 10),
      quantity: parseInt(row.product_quantity, 10),
    },
    packagingMaterial: {
      batchCount: parseInt(row.packaging_batch_count, 10),
      quantity: parseInt(row.packaging_quantity, 10),
    },
  },

  byStatus: statusRows.map((s) => ({
    statusId: s.status_id,
    statusName: s.status_name,
    batchCount: parseInt(s.batch_count, 10),
    quantity: parseInt(s.total_quantity, 10),
    reserved: parseInt(s.total_reserved, 10),
    available: parseInt(s.total_available, 10),
  })),
});

/**
 * Groups flat SKU rows under their parent product with product-level totals.
 *
 * @param {object[]} rows
 * @returns {object[]}
 */
const transformWarehouseProductSummary = (rows) => {
  const productMap = new Map();

  rows.forEach((row) => {
    const pid = row.product_id;

    if (!productMap.has(pid)) {
      productMap.set(pid, {
        productId: pid,
        productName: row.product_name,
        brand: row.brand,
        totalQuantity: 0,
        totalReserved: 0,
        totalAvailable: 0,
        batchCount: 0,
        earliestExpiry: null,
        skus: [],
      });
    }

    const product = productMap.get(pid);
    const qty = parseInt(row.total_quantity, 10);
    const reserved = parseInt(row.total_reserved, 10);
    const available = parseInt(row.total_available, 10);
    const batches = parseInt(row.batch_count, 10);
    const expiry = row.earliest_expiry;

    product.totalQuantity += qty;
    product.totalReserved += reserved;
    product.totalAvailable += available;
    product.batchCount += batches;

    if (
      expiry &&
      (!product.earliestExpiry || expiry < product.earliestExpiry)
    ) {
      product.earliestExpiry = expiry;
    }

    product.skus.push({
      skuId: row.sku_id,
      sku: row.sku,
      sizeLabel: row.size_label,
      countryCode: row.country_code,
      marketRegion: row.market_region,
      totalQuantity: qty,
      totalReserved: reserved,
      totalAvailable: available,
      batchCount: batches,
      earliestExpiry: expiry,
    });
  });

  return Array.from(productMap.values());
};

/**
 * @param {object[]} rows
 * @returns {object[]}
 */
const transformWarehousePackagingSummary = (rows) =>
  rows.map((row) => ({
    packagingMaterialId: row.packaging_material_id,
    packagingMaterialCode: row.packaging_material_code,
    packagingMaterialName: row.packaging_material_name,
    packagingMaterialCategory: row.packaging_material_category,
    totalQuantity: parseInt(row.total_quantity, 10),
    totalReserved: parseInt(row.total_reserved, 10),
    totalAvailable: parseInt(row.total_available, 10),
    batchCount: parseInt(row.batch_count, 10),
    earliestExpiry: row.earliest_expiry,
  }));

module.exports = {
  transformPaginatedWarehouseInventory,
  transformWarehouseInventoryDetailRecord,
  transformWarehouseSummary,
  transformWarehouseProductSummary,
  transformWarehousePackagingSummary,
};

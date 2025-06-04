const { getProductDisplayName } = require('../utils/display-name-utils');
const { transformPaginatedResult, deriveInventoryStatusFlags } = require('../utils/transformer-utils');
const { cleanObject } = require('../utils/object-utils');
const { differenceInDays } = require('date-fns');
const { transformInventoryRecordBase } = require('./transform-inventory-record-base');

/**
 * Transforms a single warehouse inventory summary row (product or material) into application format.
 *
 * @param {object} row - A single row from the DB result.
 * @returns {object} - Transformed warehouse inventory summary.
 */
const transformWarehouseInventoryItemSummaryRow = (row) => {
  const isProduct = row.item_type === 'product';
  
  const status = deriveInventoryStatusFlags({
    nearest_expiry_date: row.nearest_expiry_date,
    earliest_manufacture_date: row.earliest_manufacture_date,
    available_quantity: row.total_available_quantity,
    reserved_quantity: row.total_reserved_quantity,
    total_lot_quantity: row.total_lot_quantity,
    display_status: row.display_status,
  });
  
  const base = {
    itemId: row.item_id,
    itemType: row.item_type,
    itemName: row.item_name,
    actualQuantity: Number(row.actual_quantity),
    availableQuantity: Number(row.total_available_quantity),
    reservedQuantity: Number(row.total_reserved_quantity),
    totalLots: Number(row.total_lots),
    lotQuantity: Number(row.total_lot_quantity),
    earliestManufactureDate: row.earliest_manufacture_date,
    nearestExpiryDate: row.nearest_expiry_date,
    displayStatus: row.display_status,
    ...status,
  };
  
  return cleanObject({
    ...base,
    ...(isProduct
      ? {
        skuId: row.item_id,
        sku: row.sku,
        productName: getProductDisplayName(row),
      }
      : {
        materialId: row.item_id,
        materialCode: row.item_code,
        materialName: row.item_name,
      }),
  });
};

/**
 * Transforms a paginated inventory result with metadata and transformed rows.
 *
 * @param {Object} paginatedResult - The raw result from `paginateQuery`
 * @param {Array<Object>} paginatedResult.data - Raw SQL rows
 * @param {Object} paginatedResult.pagination - Pagination metadata (page, limit, totalRecords, totalPages)
 * @returns {{
 *   data: Array<Object>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }} Transformed result for frontend consumption
 */
const transformPaginatedWarehouseInventoryItemSummary = (paginatedResult) =>
  transformPaginatedResult(paginatedResult, transformWarehouseInventoryItemSummaryRow);

/**
 * Transform a single raw warehouse inventory summary record into a clean structure.
 *
 * @param {Object} row - Raw DB row from warehouse inventory summary query.
 * @returns {Object} Cleaned and enriched inventory record.
 */
const transformWarehouseInventorySummaryDetailsItem = (row) =>
  cleanObject({
    warehouseInventoryId: row.warehouse_inventory_id,
    
    item: row.batch_type === 'product'
      ? cleanObject({
        type: 'sku',
        id: row.sku_id,
        code: row.sku,
      })
      : cleanObject({
        type: 'material',
        id: row.material_id,
        code: row.material_code,
      }),
    
    lotNumber: row.lot_number,
    manufactureDate: row.product_manufacture_date || row.material_manufacture_date,
    expiryDate: row.product_expiry_date || row.material_expiry_date,
    
    quantity: cleanObject({
      warehouseQuantity: row.warehouse_quantity,
      reserved: row.reserved_quantity,
      available: Math.max(
        (row.warehouse_quantity || 0) - (row.reserved_quantity || 0),
        0
      ),
    }),
    
    status: cleanObject({
      id: row.status_id,
      name: row.status_name,
      date: row.status_date,
    }),
    
    timestamps: cleanObject({
      inboundDate: row.inbound_date,
      outboundDate: row.outbound_date,
      lastUpdate: row.last_update,
    }),
    durationInStorage: row.inbound_date
      ? differenceInDays(new Date(), new Date(row.inbound_date))
      : null,
    
    warehouse: cleanObject({
      id: row.warehouse_id,
      name: row.warehouse_name,
    }),
  });

/**
 * Transform a paginated warehouse inventory summary result.
 *
 * @param {Object} paginatedResult - Raw-paginated result from repository.
 * @returns {Object} Transformed paginated result.
 */
const transformPaginatedWarehouseInventorySummaryDetails = (paginatedResult) =>
  transformPaginatedResult(paginatedResult, transformWarehouseInventorySummaryDetailsItem);

/**
 * Transforms a single raw warehouse inventory row into structured, display-ready data.
 * Dynamically handles both product and packaging material item types.
 *
 * @param {Object} row - A raw DB row from the warehouse inventory query
 * @returns {Object} Transformed and cleaned warehouse inventory object
 */
const transformWarehouseInventoryRecord = (row) =>
  transformInventoryRecordBase(row, {
    idField: 'warehouse_inventory_id',
    scopeKey: 'warehouse',
    scopeIdField: 'warehouse_id',
    scopeNameField: 'warehouse_name',
    quantityField: 'warehouse_quantity',
  });

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
  transformPaginatedResult(paginatedResult, transformWarehouseInventoryRecord);

/**
 * Transforms raw warehouse inventory records from SQL result into a normalized structure.
 *
 * Dynamically merges product or material info into a single `itemInfo` field.
 * Removes null/undefined fields using `cleanObject` for a cleaner response.
 *
 * @param {Array<Object>} rows - Raw DB rows from the warehouse inventory join query.
 * @returns {Array<Object>} - Transformed and cleaned records.
 */
const transformInsertedWarehouseInventoryRecords = (rows) => {
  if (!Array.isArray(rows)) return [];
  
  return rows.map((row) => {
    const base = {
      id: row.id,
      quantity: row.warehouse_quantity,
      reserved: row.reserved_quantity,
      batchType: row.batch_type,
    };
    
    const itemInfo =
      row.batch_type === 'product'
        ? {
          lotNumber: row.product_lot_number,
          expiryDate: row.product_expiry_date,
          name: getProductDisplayName(row),
          itemType: 'product',
        }
        : row.batch_type === 'packaging_material'
          ? {
            lotNumber: row.material_lot_number,
            expiryDate: row.material_expiry_date,
            name: row.material_name,
            itemType: 'material',
          }
          : { itemType: 'unknown' };
    
    return cleanObject({ ...base, ...itemInfo });
  });
};

module.exports = {
  transformPaginatedWarehouseInventoryItemSummary,
  transformPaginatedWarehouseInventorySummaryDetails,
  transformPaginatedWarehouseInventoryRecordResults,
  transformInsertedWarehouseInventoryRecords,
};

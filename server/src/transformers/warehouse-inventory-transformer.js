const {
  getStockLevel,
  getExpirySeverity,
} = require('../utils/inventory-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');
const { transformPaginatedResult, deriveInventoryStatusFlags, cleanObject } = require('../utils/transformer-utils');

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
 * Transform a single raw warehouse inventory summary record into clean structure.
 *
 * @param {Object} row - Raw DB row from warehouse inventory summary query.
 * @returns {Object} Cleaned and enriched inventory record.
 */
const transformWarehouseInventorySummaryDetailsItem = (row) =>
  cleanObject({
    warehouseInventoryId: row.warehouse_inventory_id,
    batchType: row.batch_type,
    
    sku: row.sku_id && cleanObject({
      id: row.sku_id,
      code: row.sku,
      name: row.product_name,
    }),
    
    material: row.material_id && cleanObject({
      id: row.material_id,
      code: row.material_code,
      name: row.material_name,
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
      date: row.status_date,
    }),
    
    timestamps: cleanObject({
      lastUpdate: row.last_update,
    }),
    
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
 * Transforms a single item summary row from warehouse inventory item summary results.
 *
 * @param {object} row - A single item summary row.
 * @returns {object} - Transformed item inventory summary.
 */
const transformWarehouseItemSummaryRow = (row) => {
  return {
    inventoryId: row.inventory_id,
    itemName: row.item_name,
    itemType: row.item_type,
    totalLots: Number(row.total_lots) || 0,
    totalReservedStock: Number(row.total_reserved_stock) || 0,
    totalLotReservedStock: Number(row.total_lot_reserved_stock) || 0,
    totalAvailableStock: Number(row.total_available_stock) || 0,
    totalQtyStock: Number(row.total_quantity_stock) || 0,
    totalZeroStockLots: Number(row.total_zero_stock_lots) || 0,
    earliestExpiry: row.earliest_expiry ? new Date(row.earliest_expiry) : null,
    latestExpiry: row.latest_expiry ? new Date(row.latest_expiry) : null,
  };
};

/**
 * Transforms the full paginated item summary result for a warehouse.
 *
 * @param {object} result - The raw-paginated result from getWarehouseItemSummary.
 * @param {Array<object>} result.data - The item summary rows.
 * @param {object} result.pagination - Pagination info.
 * @returns {object} - Transformed result with mapped item summary data.
 */
const transformPaginatedWarehouseItemSummary = ({
  data = [],
  pagination = {},
}) => {
  const transformed = data.map(transformWarehouseItemSummaryRow);

  return {
    itemSummaryData: transformed,
    pagination: {
      page: Number(pagination.page || 1),
      limit: Number(pagination.limit || 10),
      totalRecords: Number(pagination.totalRecords || 0),
      totalPages: Number(pagination.totalPages || 0),
    },
  };
};

/**
 * Transforms a single warehouse inventory lot detail row.
 * Adds metadata and computed stock/expiry info.
 *
 * @param {object} item - A single row from `getWarehouseInventoryDetailsByWarehouseId`
 * @returns {object}
 */
const transformWarehouseInventoryLotDetail = (item) => {
  const reservedStock = Number(item.reserved_stock) || 0;
  const availableStock = Number(item.available_stock) || 0;
  const lotReserved = Number(item.lot_reserved_quantity) || 0;

  const expiryDate = item.expiry_date ? new Date(item.expiry_date) : null;
  const today = new Date();

  const isExpired = expiryDate ? expiryDate < today : false;
  const isNearExpiry = expiryDate
    ? expiryDate >= today &&
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 90
    : false;

  const stockLevel = getStockLevel(availableStock);
  const expirySeverity = getExpirySeverity(expiryDate);
  const isLowStock = availableStock <= 30;

  return {
    warehouseInventoryId: item.warehouse_inventory_id,
    inventoryId: item.inventory_id,
    itemName: item.item_name,
    itemType: item.item_type,
    warehouseInventoryLotId: item.warehouse_inventory_lot_id,
    lotNumber: item.lot_number,
    lotQuantity: item.lot_quantity,
    reservedStock,
    lotReserved,
    availableStock,
    warehouseFees: Number(item.warehouse_fees) || 0,
    lotStatus: item.lot_status || 'Unknown',
    manufactureDate: item.manufacture_date
      ? new Date(item.manufacture_date)
      : null,
    expiryDate,
    inboundDate: item.inbound_date ? new Date(item.inbound_date) : null,
    outboundDate: item.outbound_date ? new Date(item.outbound_date) : null,
    lastUpdate: item.last_update ? new Date(item.last_update) : null,

    inventoryCreated: {
      date: item.inventory_created_at
        ? new Date(item.inventory_created_at)
        : null,
      by: item.inventory_created_by,
    },
    inventoryUpdated: {
      date: item.inventory_updated_at
        ? new Date(item.inventory_updated_at)
        : null,
      by: item.inventory_updated_by,
    },
    lotCreated: {
      date: item.lot_created_at ? new Date(item.lot_created_at) : null,
      by: item.lot_created_by,
    },
    lotUpdated: {
      date: item.lot_updated_at ? new Date(item.lot_updated_at) : null,
      by: item.lot_updated_by,
    },

    indicators: {
      isExpired,
      isNearExpiry,
      isLowStock,
      stockLevel,
      expirySeverity,
    },
  };
};

/**
 * Transforms a list of inventory lot detail rows.
 * @param {Array<object>} rows
 * @returns {Array<object>}
 */
const transformWarehouseInventoryLotDetailList = (rows = []) => {
  return rows.map(transformWarehouseInventoryLotDetail);
};

/**
 * Transforms raw warehouse inventory data from the DB into a structured response.
 * @param {Array} dbResults - Raw DB results grouped by warehouse
 * @returns {Array} Transformed structured inventory data per warehouse
 */
const transformWarehouseInventoryRecords = (dbResults) => {
  return dbResults.map((warehouse) => {
    const { warehouse_id, warehouse_name, total_records, inventory_records } =
      warehouse;

    const transformedRecords = inventory_records.map((record) => ({
      warehouseLotId: record.warehouse_lot_id,
      inventoryId: record.inventory_id,
      productName: record.product_name,
      lotNumber: record.lot_number,
      lotQuantity: record.lot_qty,
      inventoryQuantity: record.inventory_qty,
      availableQuantity: record.available_quantity,
      lotReservedQuantity: record.lot_reserved_quantity,
      manufactureDate: record.manufacture_date,
      expiryDate: record.expiry_date,
      inboundDate: record.inbound_date,
      locationId: record.location_id,
      insertedQuantity: record.inserted_quantity,

      audit: {
        createdAt: record.lot_created_at,
        createdBy: record.lot_created_by,
        updatedAt: record.lot_updated_at,
        updatedBy: record.lot_updated_by,
      },
    }));

    return {
      warehouseId: warehouse_id,
      warehouseName: warehouse_name,
      totalRecords: Number(total_records),
      inventoryRecords: transformedRecords,
    };
  });
};

module.exports = {
  transformPaginatedWarehouseInventoryItemSummary,
  transformPaginatedWarehouseInventorySummaryDetails,
  transformWarehouseItemSummaryRow,
  transformPaginatedWarehouseItemSummary,
  transformWarehouseInventoryLotDetail,
  transformWarehouseInventoryLotDetailList,
  transformWarehouseInventoryRecords,
};

const { getStockLevel, getExpirySeverity } = require('../utils/inventory-utils');

/**
 * Transforms a single inventory summary row from the DB into clean application format.
 *
 * @param {object} row - A single row from the DB result.
 * @returns {object} - Transformed inventory summary.
 */
const transformInventorySummary = (row) => {
  const nearestExpiryDate = row.nearest_expiry_date
    ? new Date(row.nearest_expiry_date)
    : null;
  
  const now = new Date();
  const expiryThreshold = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
  
  const availableQty = Number(row.total_available_quantity);
  
  return {
    productId: row.product_id,
    itemName: row.item_name,
    totalInventoryEntries: Number(row.total_inventory_entries),
    recordedQuantity: Number(row.recorded_quantity),
    actualQuantity: Number(row.actual_quantity),
    availableQuantity: availableQty,
    reservedQuantity: Number(row.total_reserved_quantity),
    totalLots: Number(row.total_lots),
    lotQuantity: Number(row.total_lot_quantity),
    earliestManufactureDate: row.earliest_manufacture_date
      ? new Date(row.earliest_manufacture_date)
      : null,
    nearestExpiryDate,
    status: row.display_status,
    isNearExpiry: nearestExpiryDate && nearestExpiryDate <= expiryThreshold,
    isLowStock: availableQty <= 30,
    stockLevel:
      availableQty === 0
        ? 'none'
        : availableQty <= 10
          ? 'critical'
          : availableQty <= 30
            ? 'low'
            : 'normal',
  };
};

/**
 * Transforms an array of inventory summary rows.
 *
 * @param {Array<object>} rows - Array of raw DB result rows.
 * @returns {Array<object>} - Array of transformed inventory summaries.
 */
const transformInventorySummaryList = (rows = []) => rows.map(transformInventorySummary);

/**
 * Transforms the complete paginated inventory summary result,
 * including pagination metadata and data array.
 *
 * @param {object} paginatedResult - The raw paginated result from the DB.
 * @param {number|string} paginatedResult.page - Current page number.
 * @param {number|string} paginatedResult.limit - Page size.
 * @param {number|string} paginatedResult.totalRecords - Total record count.
 * @param {number|string} paginatedResult.totalPages - Total page count.
 * @param {Array<object>} paginatedResult.data - Array of raw DB result rows.
 * @returns {object} - Object containing metadata and transformed data.
 */
const transformPaginatedInventorySummary = (paginatedResult) => ({
  pagination: {
    page: Number(paginatedResult.page),
    limit: Number(paginatedResult.limit),
    totalRecords: Number(paginatedResult.totalRecords),
    totalPages: Number(paginatedResult.totalPages),
  },
  data: transformInventorySummaryList(paginatedResult.data),
});

/**
 * Transforms a single raw inventory record row from the database into a normalized object.
 *
 * Adds calculated fields like:
 * - isExpired: `true` if the expiry date is before today
 * - isNearExpiry: `true` if the expiry date is within the next 90 days
 * - isLowStock: `true` if availableQuantity is 30 or less
 * - stockLevel: One of `'none'`, `'critical'`, `'low'`, `'normal'` based on quantity
 * - expirySeverity:
 *     - `'expired'`: already expired
 *     - `'expired_soon'`: within 3 months (90 days)
 *     - `'critical'`: within 3–6 months
 *     - `'warning'`: within 6–12 months
 *     - `'notice'`: within 12–18 months
 *     - `'safe'`: more than 18 months
 *     - `'unknown'`: no expiry date
 *
 * @param {object} row - A single raw DB row representing an inventory record.
 * @returns {object} Transformed inventory record with normalized structure and business logic fields.
 */
const transformInventoryRecord = (row) => {
  const now = new Date();
  const nearestExpiryDate = row.nearest_expiry_date ? new Date(row.nearest_expiry_date) : null;
  const availableQty = Number(row.available_quantity) || 0;
  
  const stockLevel = getStockLevel(availableQty);
  const expirySeverity = getExpirySeverity(nearestExpiryDate);
  
  return {
    inventoryId: row.inventory_id,
    itemType: row.item_type,
    productId: row.product_id,
    itemName: row.item_name,
    locationId: row.location_id,
    warehouseId: row.warehouse_id,
    placeName: row.place_name,
    inboundDate: row.inbound_date ? new Date(row.inbound_date) : null,
    outboundDate: row.outbound_date ? new Date(row.outbound_date) : null,
    lastUpdate: row.last_update ? new Date(row.last_update) : null,
    statusId: row.status_id,
    statusName: row.status_name,
    statusDate: row.status_date ? new Date(row.status_date) : null,
    createdAt: row.created_at ? new Date(row.created_at) : null,
    updatedAt: row.updated_at ? new Date(row.updated_at) : null,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    warehouseFee: parseFloat(row.warehouse_fee) || 0,
    reservedQuantity: Number(row.reserved_quantity) || 0,
    availableQuantity: availableQty,
    totalLotQuantity: Number(row.total_lot_quantity) || 0,
    earliestManufactureDate: row.earliest_manufacture_date ? new Date(row.earliest_manufacture_date) : null,
    nearestExpiryDate,
    displayStatus: row.display_status,
    isExpired: nearestExpiryDate ? nearestExpiryDate < now : false,
    isNearExpiry: nearestExpiryDate ? nearestExpiryDate <= new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) : false,
    isLowStock: availableQty <= 30,
    stockLevel,
    expirySeverity,
  };
};

/**
 * Transforms a list of raw inventory DB rows.
 *
 * @param {Array<object>} rows - Array of raw DB result rows.
 * @returns {Array<object>} - Array of transformed inventory records.
 */
const transformInventoryList = (rows = []) => rows.map(transformInventoryRecord);

/**
 * Transforms the complete paginated inventory result.
 *
 * @param {object} paginatedResult - The raw paginated result from the DB.
 * @param {number|string} paginatedResult.page - Current page number.
 * @param {number|string} paginatedResult.limit - Page size.
 * @param {number|string} paginatedResult.totalRecords - Total number of records.
 * @param {number|string} paginatedResult.totalPages - Total number of pages.
 * @param {Array<object>} paginatedResult.data - The raw rows.
 * @returns {object} - Object containing pagination metadata and transformed data.
 */
const transformPaginatedInventoryRecords = (paginatedResult) => ({
  pagination: {
    page: Number(paginatedResult.pagination.page),
    limit: Number(paginatedResult.pagination.limit),
    totalRecords: Number(paginatedResult.pagination.totalRecords),
    totalPages: Number(paginatedResult.pagination.totalPages),
  },
  data: transformInventoryList(paginatedResult.data),
});

module.exports = {
  transformInventorySummary,
  transformInventorySummaryList,
  transformPaginatedInventorySummary,
  transformInventoryRecord,
  transformInventoryList,
  transformPaginatedInventoryRecords,
};

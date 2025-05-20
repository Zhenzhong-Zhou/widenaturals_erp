const {
  getStockLevel,
  getExpirySeverity,
} = require('../utils/inventory-utils');
const {
  transformPaginatedResult,
  deriveInventoryStatusFlags, cleanObject,
} = require('../utils/transformer-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');

/**
 * Transforms a raw SQL row from the location inventory summary query
 * into a normalized inventory record with derived stock/expiry info.
 *
 * Supports both product and packaging material inventory types.
 * Removes irrelevant null values and separates product vs. material details.
 *
 * @param {Object} row - Raw SQL result row
 * @returns {Object} Transformed inventory record for frontend consumption
 */
const transformLocationInventorySummaryRow = (row) => {
  const isProduct = row.item_type === 'product';
  const productName = getProductDisplayName(row);
  const statusInfo = deriveInventoryStatusFlags(row);
  
  return cleanObject({
    id: row.item_id,
    typeLabel: isProduct ? 'product' : 'packaging_material',
    displayName: isProduct
      ? productName || row.sku || '[Unnamed Product]'
      : row.material_name || row.material_code || '[Unnamed Material]',
    
    totalLots: Number(row.total_lots) || 0,
    earliestManufactureDate: row.earliest_manufacture_date || null,
    createdAt: row.created_at || null,
    
    ...statusInfo,
  });
};

/**
 * Transforms a paginated SQL result of raw location inventory summary rows
 * into a fully structured, frontend-ready result using `transformLocationInventorySummaryRow`.
 *
 * This includes:
 * - Row-level normalization (product/material shape)
 * - Derived stock, expiry, and quantity flags
 * - Preserves pagination metadata
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
const transformPaginatedLocationInventorySummaryResult = (paginatedResult) =>
  transformPaginatedResult(paginatedResult, transformLocationInventorySummaryRow);

/**
 * Transform a single raw location inventory summary record.
 *
 * @param {Object} row - Raw DB record.
 * @returns {Object} Transformed and cleaned object.
 */
const transformLocationInventorySummaryDetailsItem = (row) =>
  cleanObject({
    locationInventoryId: row.location_inventory_id,
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
      available: row.location_quantity,
      reserved: row.reserved_quantity,
    }),
    
    timestamps: cleanObject({
      inboundDate: row.inbound_date,
      outboundDate: row.outbound_date,
      lastUpdate: row.last_update,
    }),
    
    location: cleanObject({
      id: row.location_id,
      name: row.location_name,
      type: row.location_type,
    }),
  });

/**
 * Transform a full paginated location inventory summary result.
 *
 * @param {Object} paginatedResult - The raw-paginated result.
 * @returns {Object} Paginated and transformed result.
 */
const transformPaginatedLocationInventorySummaryDetails = (paginatedResult) =>
  transformPaginatedResult(paginatedResult, transformLocationInventorySummaryDetailsItem);

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
  const nearestExpiryDate = row.nearest_expiry_date
    ? new Date(row.nearest_expiry_date)
    : null;
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
    earliestManufactureDate: row.earliest_manufacture_date
      ? new Date(row.earliest_manufacture_date)
      : null,
    nearestExpiryDate,
    displayStatus: row.display_status,
    isExpired: nearestExpiryDate ? nearestExpiryDate < now : false,
    isNearExpiry: nearestExpiryDate
      ? nearestExpiryDate <= new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
      : false,
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
const transformInventoryList = (rows = []) =>
  rows.map(transformInventoryRecord);

/**
 * Transforms the complete paginated inventory result.
 *
 * @param {object} paginatedResult - The raw-paginated result from the DB.
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
  transformPaginatedLocationInventorySummaryResult,
  transformPaginatedLocationInventorySummaryDetails,
  transformInventoryRecord,
  transformInventoryList,
  transformPaginatedInventoryRecords,
};

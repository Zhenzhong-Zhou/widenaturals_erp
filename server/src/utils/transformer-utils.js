/**
 * Transforms a generic paginated result using a row-level transformer.
 *
 * @param {Object} paginatedResult - The paginated query result.
 * @param {Function} transformFn - Function to apply to each data row.
 * @returns {Object} Transformed result with formatted pagination and data.
 */
const transformPaginatedResult = (paginatedResult, transformFn) => ({
  data: (paginatedResult.data || []).map(transformFn),
  pagination: {
    page: Number(paginatedResult.pagination?.page ?? 1),
    limit: Number(paginatedResult.pagination?.limit ?? 10),
    totalRecords: Number(paginatedResult.pagination?.totalRecords ?? 0),
    totalPages: Number(paginatedResult.pagination?.totalPages ?? 1),
  },
});

/**
 * Derives stock and expiry status information from an inventory row.
 *
 * @param {Object} row - Raw inventory row from SQL query
 * @param {Date | string} [row.nearest_expiry_date] - Earliest upcoming expiry date
 * @param {number | string} [row.available_quantity] - Available inventory amount
 * @param {number | string} [row.reserved_quantity] - Reserved inventory amount
 * @param {number | string} [row.total_lot_quantity] - Total quantity across lots
 * @param {Date | string} [row.earliest_manufacture_date] - First manufacture date
 * @param {string} [row.display_status] - High-level inventory status (optional)
 * @param {number} [lowStockThreshold=30] - Configurable threshold for low stock
 * @param {number} [nearExpiryDays=90] - Configurable expiry warning window
 *
 * @returns {{
 *   reservedQuantity: number,
 *   availableQuantity: number,
 *   totalLotQuantity: number,
 *   earliestManufactureDate: Date | null,
 *   nearestExpiryDate: Date | null,
 *   displayStatus: string | null,
 *   isExpired: boolean,
 *   isNearExpiry: boolean,
 *   isLowStock: boolean,
 *   stockLevel: 'expired' | 'low_stock' | 'in_stock',
 *   expirySeverity: 'critical' | 'warning' | 'normal'
 * }}
 */
const deriveInventoryStatusFlags = (row, lowStockThreshold = 30, nearExpiryDays = 90) => {
  const now = new Date();
  
  const nearestExpiryDate = row.nearest_expiry_date
    ? new Date(row.nearest_expiry_date)
    : null;
  
  const availableQty = Number(row.available_quantity) || 0;
  const reservedQty = Number(row.reserved_quantity) || 0;
  const totalQty = Number(row.total_lot_quantity) || 0;
  
  const isExpired = nearestExpiryDate ? nearestExpiryDate < now : false;
  const isNearExpiry = nearestExpiryDate
    ? nearestExpiryDate <= new Date(now.getTime() + nearExpiryDays * 24 * 60 * 60 * 1000)
    : false;
  const isLowStock = availableQty <= lowStockThreshold;
  
  const stockLevel = isExpired
    ? 'expired'
    : isLowStock
      ? 'low_stock'
      : 'in_stock';
  
  const expirySeverity = isExpired
    ? 'critical'
    : isNearExpiry
      ? 'warning'
      : 'normal';
  
  return {
    reservedQuantity: reservedQty,
    availableQuantity: availableQty,
    totalLotQuantity: totalQty,
    earliestManufactureDate: row.earliest_manufacture_date
      ? new Date(row.earliest_manufacture_date)
      : null,
    nearestExpiryDate,
    displayStatus: row.display_status || null,
    isExpired,
    isNearExpiry,
    isLowStock,
    stockLevel,
    expirySeverity,
  };
}

module.exports = {
  transformPaginatedResult,
  deriveInventoryStatusFlags,
};
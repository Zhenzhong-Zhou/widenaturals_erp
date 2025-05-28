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
 * Derives high-level inventory status flags and severity from raw inventory data.
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
 *   stockLevel: 'expired' | 'low_stock' | 'in_stock',
 *   expirySeverity: 'critical' | 'warning' | 'normal'
 * }}
 */
const deriveInventoryStatusFlags = (row, lowStockThreshold = 30, nearExpiryDays = 90) => {
  const now = new Date();
  
  const nearestExpiryDate = row.nearest_expiry_date
    ? new Date(row.nearest_expiry_date)
    : null;
  
  const manufactureDate = row.earliest_manufacture_date
    ? new Date(row.earliest_manufacture_date)
    : null;
  
  const availableQty = Number(row.available_quantity) || 0;
  const reservedQty = Number(row.reserved_quantity) || 0;
  const totalQty = Number(row.total_lot_quantity) || 0;
  
  const stockLevel =
    nearestExpiryDate && nearestExpiryDate < now
      ? 'expired'
      : availableQty <= lowStockThreshold
        ? 'low_stock'
        : 'in_stock';
  
  const expirySeverity =
    nearestExpiryDate && nearestExpiryDate < now
      ? 'critical'
      : nearestExpiryDate &&
      nearestExpiryDate <= new Date(now.getTime() + nearExpiryDays * 86400000)
        ? 'warning'
        : 'normal';
  
  return {
    reservedQuantity: reservedQty,
    availableQuantity: availableQty,
    totalLotQuantity: totalQty,
    earliestManufactureDate: manufactureDate,
    nearestExpiryDate,
    displayStatus: row.display_status || null,
    stockLevel,
    expirySeverity,
  };
};

module.exports = {
  transformPaginatedResult,
  deriveInventoryStatusFlags,
};

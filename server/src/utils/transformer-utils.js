/**
 * Transforms a generic paginated result using a row-level transformer.
 *
 * @param {Object} paginatedResult - The paginated query result.
 * @param {Function} transformFn - Function to apply to each data row.
 * @param {Object} [options] - Optional behavior flags.
 * @param {boolean} [options.includeLoadMore=false] - Include top-level `items`, `offset`, `hasMore`.
 * @returns {Object} Transformed result with pagination and optionally load-more fields.
 */
const transformPaginatedResult = (paginatedResult, transformFn, options = {}) => {
  const {
    data = [],
    pagination = {},
  } = paginatedResult;
  
  const transformedItems = data.map(transformFn);
  
  // Support both page and offset style
  const page = Number(pagination.page ?? 1);
  const limit = Number(pagination.limit ?? 10);
  const totalRecords = Number(pagination.totalRecords ?? 0);
  const offset = pagination.offset ?? (page - 1) * limit;
  const totalPages = pagination.totalPages ?? Math.ceil(totalRecords / limit);
  
  if (options.includeLoadMore) {
    return {
      items: transformedItems,
      offset,
      limit,
      hasMore: offset + transformedItems.length < totalRecords,
    };
  }
  
  return {
    data: transformedItems,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
      offset,
    },
  };
};

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

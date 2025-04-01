/**
 * Transforms a single inventory summary row from the DB into clean application format.
 *
 * @param {object} row - A single row from the DB result.
 * @returns {object} - Transformed inventory summary.
 */
const transformInventorySummary = (row) => {
  return {
    productId: row.product_id,
    itemName: row.item_name,
    totalInventoryEntries: Number(row.total_inventory_entries),
    recordedQuantity: Number(row.recorded_quantity),
    actualQuantity: Number(row.actual_quantity),
    availableQuantity: Number(row.total_available_quantity),
    reservedQuantity: Number(row.total_reserved_quantity),
    totalLots: Number(row.total_lots),
    lotQuantity: Number(row.total_lot_quantity),
    earliestManufactureDate: row.earliest_manufacture_date
      ? new Date(row.earliest_manufacture_date)
      : null,
    nearestExpiryDate: row.nearest_expiry_date
      ? new Date(row.nearest_expiry_date)
      : null,
    status: row.display_status,
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

module.exports = {
  transformInventorySummary,
  transformInventorySummaryList,
  transformPaginatedInventorySummary,
};

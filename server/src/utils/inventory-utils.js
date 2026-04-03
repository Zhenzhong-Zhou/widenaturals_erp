/**
 * Determines the stock level based on available quantity.
 * @param {number} availableQty
 * @returns {'none' | 'critical' | 'low' | 'normal'}
 */
const getStockLevel = (availableQty) => {
  if (availableQty === 0) return 'none';
  if (availableQty <= 10) return 'critical';
  if (availableQty <= 30) return 'low';
  return 'normal';
};

/**
 * Determines the severity of expiry based on expiry date.
 * @param {Date|null} expiryDate
 * @returns {string}
 */
const getExpirySeverity = (expiryDate) => {
  if (!expiryDate) return 'unknown';
  const today = new Date();
  const daysLeft =
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 90) return 'expired_soon';
  if (daysLeft <= 180) return 'critical';
  if (daysLeft <= 365) return 'warning';
  if (daysLeft <= 547) return 'notice';
  return 'safe';
};

/**
 * Extracts batch data based on the batch type.
 * Supports 'product' and 'packaging_material' types.
 *
 * @param {AllocationReviewRow} row - A row from the allocation review result.
 * @returns {BatchData} - The corresponding batch data object (never null).
 */
const getBatchData = (row) => {
  if (!row || typeof row !== 'object') return {};

  switch (row.batch_type) {
    case 'product':
      return row.product_batch ?? {};
    case 'packaging_material':
      return row.packaging_material_batch ?? {};
    default:
      return {};
  }
};

/**
 * Returns a normalized batch summary object based on batch type.
 *
 * This helper builds a simplified `batch` object for use in allocation review,
 * extracting common fields from `product_batch` or `packaging_material_batch`
 * based on the `row.batch_type`.
 *
 * @param {Object} row - A single row from the inventory allocation review result.
 * @param {string} row.batch_type - The type of batch ('product', 'packaging_material', etc.).
 * @param {Object} [row.product_batch] - The product batch object (if type is 'product').
 * @param {Object} [row.packaging_material_batch] - The packaging material batch (if type is 'packaging_material').
 * @returns {Object} A summary object with keys:
 *   - `type` (always),
 *   - `lotNumber`, `expiryDate`, `manufactureDate` (for all types),
 *   - `snapshotName` (only for packaging_material).
 */
const getBatchSummary = (row) => {
  const data = getBatchData(row);
  const type = row?.batch_type ?? 'unknown';

  if (type === 'product') {
    return {
      type,
      lotNumber: data.lot_number,
      expiryDate: data.expiry_date,
      manufactureDate: data.manufacture_date,
    };
  }

  if (type === 'packaging_material') {
    return {
      type,
      lotNumber: data.lot_number,
      expiryDate: data.expiry_date,
      manufactureDate: data.manufacture_date,
      snapshotName: data.material_snapshot_name,
    };
  }

  return { type };
};

/**
 * Extracts the list of warehouse inventory entries from the batch,
 * based on the batch_type ('product' or 'packaging_material').
 *
 * @param {Object} row - A single allocation review row.
 * @returns {Array<Object>} - An array of warehouse inventory objects (can be empty).
 */
const getWarehouseInventoryList = (row) => {
  if (row.batch_type === 'product') {
    return Array.isArray(row.product_batch?.warehouse_inventory)
      ? row.product_batch.warehouse_inventory
      : [];
  }
  if (row.batch_type === 'packaging_material') {
    return Array.isArray(row.packaging_material_batch?.warehouse_inventory)
      ? row.packaging_material_batch.warehouse_inventory
      : [];
  }
  return [];
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
const deriveInventoryStatusFlags = (
  row,
  lowStockThreshold = 30,
  nearExpiryDays = 90
) => {
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
      nearestExpiryDate <=
      new Date(now.getTime() + nearExpiryDays * 86400000)
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
  getStockLevel,
  getExpirySeverity,
  getBatchData,
  getBatchSummary,
  getWarehouseInventoryList,
  deriveInventoryStatusFlags,
};

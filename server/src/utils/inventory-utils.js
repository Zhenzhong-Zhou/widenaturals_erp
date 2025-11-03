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

module.exports = {
  getStockLevel,
  getExpirySeverity,
  getBatchData,
  getBatchSummary,
  getWarehouseInventoryList,
};

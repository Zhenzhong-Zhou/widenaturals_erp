/**
 * Extracts and deduplicates SKU and packaging material IDs from a list of order items.
 *
 * This utility function iterates through each item and collects `sku_id` and
 * `packaging_material_id` values into separate arrays, removing duplicates.
 *
 * @param {Array<object>} items - Array of order item objects.
 * Each item may contain `sku_id` and/or `packaging_material_id` fields.
 *
 * @returns {Object} An object containing:
 *   - {Array<string>} skuIds - Unique list of non-null SKU IDs.
 *   - {Array<string>} packagingMaterialIds - Unique list of non-null packaging material IDs.
 *
 * @example
 * const items = [
 *   { sku_id: 'sku-1', packaging_material_id: 'mat-1' },
 *   { sku_id: 'sku-2' },
 *   { packaging_material_id: 'mat-1' }, // duplicate will be removed
 * ];
 * const result = extractOrderItemIdsByType(items);
 * // result: { skuIds: ['sku-1', 'sku-2'], packagingMaterialIds: ['mat-1'] }
 */
const extractOrderItemIdsByType = (items = []) => {
  const skuIds = [];
  const packagingMaterialIds = [];
  
  for (const item of items) {
    if (item.sku_id) skuIds.push(item.sku_id);
    if (item.packaging_material_id) packagingMaterialIds.push(item.packaging_material_id);
  }
  
  return {
    skuIds: [...new Set(skuIds)],
    packagingMaterialIds: [...new Set(packagingMaterialIds)],
  };
};

/**
 * Transforms a batch allocation result into a flat list of insertable row objects
 * for the `inventory_allocations` table (or equivalent).
 *
 * Supports both legacy structure (`allocatedBatches`) and modern nested structure
 * (`allocated.allocatedBatches`) returned from allocation logic.
 *
 * This function flattens each `order_item_id`'s allocated batches into a uniform row
 * format, suitable for direct DB insertion, and merges optional metadata into each row.
 *
 * @param {Array<Object>} allocationResult - List of allocation results. Each item may have:
 *   - {string} order_item_id - The ID of the order item being fulfilled.
 *   - {Object} allocated - Optional nested allocation result with:
 *       - {Array<Object>} allocatedBatches - List of allocated batch entries.
 *   - {Array<Object>} allocatedBatches - (legacy support) Direct list of allocated batch entries.
 *
 *   Each batch object may contain:
 *     - {string} batch_id - ID of the allocated batch.
 *     - {string} warehouse_id - ID of the warehouse the batch belongs to.
 *     - {number} allocated_quantity - Quantity allocated from this batch.
 *
 * @param {Object} [options={}] - Optional additional fields to be included in every row
 *   (e.g., `created_by`, `created_at`, `transfer_order_item_id`, etc.).
 *
 * @returns {Array<Object>} List of flattened rows, each containing:
 *   - order_item_id: string
 *   - transfer_order_item_id: null (default unless overridden via `options`)
 *   - warehouse_id: string
 *   - batch_id: string
 *   - allocated_quantity: number
 *   - ...any additional key-value pairs from `options`
 *
 * @example
 * const allocationResult = [
 *   {
 *     order_item_id: 'item-123',
 *     allocated: {
 *       allocatedBatches: [
 *         { batch_id: 'batch-1', warehouse_id: 'wh-1', allocated_quantity: 5 },
 *         { batch_id: 'batch-2', warehouse_id: 'wh-1', allocated_quantity: 10 }
 *       ]
 *     }
 *   }
 * ];
 *
 * const rows = transformAllocationResultToInsertRows(allocationResult, { created_by: 'admin' });
 *
 * // Output:
 * // [
 * //   { order_item_id: 'item-123', transfer_order_item_id: null, warehouse_id: 'wh-1', batch_id: 'batch-1', allocated_quantity: 5, created_by: 'admin' },
 * //   { order_item_id: 'item-123', transfer_order_item_id: null, warehouse_id: 'wh-1', batch_id: 'batch-2', allocated_quantity: 10, created_by: 'admin' }
 * // ]
 */
const transformAllocationResultToInsertRows = (allocationResult, options = {}) => {
  if (!Array.isArray(allocationResult)) return [];
  
  const rows = [];
  for (const item of allocationResult) {
    const { order_item_id } = item;
    const batches =
      item?.allocated?.allocatedBatches ??
      item?.allocatedBatches ??
      [];
    
    for (const batch of batches) {
      const qty = Number(batch?.allocated_quantity ?? 0);
      if (!order_item_id || !batch?.batch_id || !batch?.warehouse_id || qty <= 0) continue;
      
      rows.push({
        order_item_id,
        transfer_order_item_id: null,
        warehouse_id: batch.warehouse_id,
        batch_id: batch.batch_id,
        allocated_quantity: qty,
        ...options,
      });
    }
  }
  return rows;
};

/**
 * Transforms raw allocation records into a simplified review payload.
 *
 * This function extracts allocation IDs from raw DB rows and pairs them
 * with the provided `orderId` to form a minimal payload used in review or
 * confirmation workflows (e.g., on the frontend or in API responses).
 *
 * @function transformAllocationReviewData
 * @param {Array<Object>} rows - Array of raw allocation rows, each containing an `id` field (allocation UUID).
 * @param {string} orderId - UUID of the associated sales order.
 *
 * @returns {{ orderId: string, allocationIds: string[] }} A review payload object:
 *   - `orderId`: the provided sales order ID.
 *   - `allocationIds`: list of UUIDs extracted from the `id` field of each row.
 *
 * @example
 * const rows = [
 *   { id: 'alloc-1', warehouse_id: 'wh-1', ... },
 *   { id: 'alloc-2', warehouse_id: 'wh-2', ... }
 * ];
 * const orderId = 'order-123';
 *
 * const result = transformAllocationReviewData(rows, orderId);
 * // Output:
 * // {
 * //   orderId: 'order-123',
 * //   allocationIds: ['alloc-1', 'alloc-2']
 * // }
 */
const transformAllocationReviewData = (rows, orderId) => {
  return {
    orderId,
    allocationIds: rows.map((row) => row.id),
  };
};

module.exports = {
  extractOrderItemIdsByType,
  transformAllocationResultToInsertRows,
  transformAllocationReviewData,
};

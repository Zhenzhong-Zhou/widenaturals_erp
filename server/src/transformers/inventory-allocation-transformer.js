const { getFullName } = require('../utils/name-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');
const { formatPackagingMaterialLabel } = require('../utils/string-utils');
const { cleanObject } = require('../utils/object-utils');
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

/**
 * @typedef {object} InventoryAllocationReviewRow
 * @property {string} allocation_id
 * @property {string} order_item_id
 * @property {string|null} transfer_order_item_id
 * @property {string} batch_id
 * @property {number} allocated_quantity
 * @property {string} allocation_status_id
 * @property {string} allocation_status_name
 * @property {string} allocation_status_code
 * @property {string} allocation_created_at
 * @property {string} allocation_updated_at
 * @property {string} allocation_created_by
 * @property {string} allocation_created_by_firstname
 * @property {string} allocation_created_by_lastname
 * @property {string} allocation_updated_by
 * @property {string} allocation_updated_by_firstname
 * @property {string} allocation_updated_by_lastname
 * @property {string} order_id
 * @property {string} quantity_ordered
 * @property {string} item_status_id
 * @property {string} item_status_name
 * @property {string} item_status_date
 * @property {string} sku_id
 * @property {string} sku
 * @property {string} barcode
 * @property {string} country_code
 * @property {string} size_label
 * @property {string} product_id
 * @property {string} product_name
 * @property {string} brand
 * @property {string} category
 * @property {string} packaging_material_id
 * @property {string} packaging_material_code
 * @property {string} packaging_material_name
 * @property {string} packaging_material_color
 * @property {string} packaging_material_size
 * @property {string} packaging_material_unit
 * @property {number} packaging_material_length_cm
 * @property {number} packaging_material_width_cm
 * @property {number} packaging_material_height_cm
 * @property {string} order_number
 * @property {string} order_status_id
 * @property {string} order_status_name
 * @property {string} order_status_code
 * @property {string} order_note
 * @property {string} salesperson_id
 * @property {string} salesperson_firstname
 * @property {string} salesperson_lastname
 * @property {string} warehouse_inventory_id
 * @property {number} warehouse_quantity
 * @property {number} reserved_quantity
 * @property {string} inventory_status_name
 * @property {string} inventory_status_date
 * @property {string} batch_type
 * @property {string} product_lot_number
 * @property {string} product_expiry_date
 * @property {string} product_inbound_date
 * @property {string} material_lot_number
 * @property {string} material_expiry_date
 * @property {string} material_name
 */

/**
 * Transforms raw inventory allocation review rows from the database into a structured format
 * with cleaned and nested fields for frontend/API consumption.
 *
 * The transformation includes:
 * - `header`: shared order-level metadata, including order number, note, status, and salesperson
 * - `items`: an array of cleaned allocation records, each including:
 *   - allocation metadata (status, quantity, timestamps)
 *   - order item details
 *   - SKU and product info
 *   - packaging material info (if applicable)
 *   - warehouse inventory status (if applicable)
 *   - batch details (for either product or packaging material)
 *
 * @param {Array<InventoryAllocationReviewRow>} rows - Raw DB rows from `getInventoryAllocationReview` query.
 *
 * @returns {{
 *   header: {
 *     orderNumber: string;
 *     note: string;
 *     createdBy: string;
 *     orderStatus: {
 *       id: string;
 *       name: string;
 *       code: string;
 *     };
 *     salesperson: {
 *       id: string;
 *       fullName: string;
 *     };
 *   };
 *   items: Array<object>;
 * } | null}
 */
const transformInventoryAllocationReviewRows = (rows) => {
  if (rows.length === 0) return null;
  
  const [first] = rows;
  
  const header = {
    orderNumber: first.order_number,
    note: first.order_note,
    createdBy: first.salesperson_id,
    orderStatus: {
      id: first.order_status_id,
      name: first.order_status_name,
      code: first.order_status_code,
    },
    salesperson: {
      id: first.salesperson_id,
      fullName: getFullName(first.salesperson_firstname, first.salesperson_lastname),
    },
  };
  
  const items = rows.map((row) => {
    const base = {
      allocationId: row.allocation_id,
      orderItemId: row.order_item_id,
      transferOrderItemId: row.transfer_order_item_id,
      batchId: row.batch_id,
      allocatedQuantity: row.allocated_quantity,
      allocationStatusId: row.allocation_status_id,
      allocationStatusName: row.allocation_status_name,
      allocationStatusCode: row.allocation_status_code,
      createdAt: row.allocation_created_at,
      updatedAt: row.allocation_updated_at,
      
      createdBy: {
        id: row.allocation_created_by,
        fullName: getFullName(row.allocation_created_by_firstname, row.allocation_created_by_lastname),
      },
      updatedBy: {
        id: row.allocation_updated_by,
        fullName: getFullName(row.allocation_updated_by_firstname, row.allocation_updated_by_lastname),
      },
      
      orderItem: {
        id: row.order_item_id,
        orderId: row.order_id,
        quantityOrdered: row.quantity_ordered,
        statusId: row.item_status_id,
        statusName: row.item_status_name,
        statusDate: row.item_status_date,
      },
      
      product: {
        product_id: row.product_id,
        sku_id: row.sku_id,
        skuCode: row.sku,
        barcode: row.barcode,
        displayName: row.sku_id
          ? getProductDisplayName({
            brand: row.brand,
            sku: row.sku,
            country_code: row.country_code,
            product_name: row.product_name,
            size_label: row.size_label,
          })
          : null,
      },
      
      packagingMaterial: row.packaging_material_id
        ? {
          id: row.packaging_material_id,
          code: row.packaging_material_code,
          label: formatPackagingMaterialLabel({
            name: row.packaging_material_name,
            size: row.packaging_material_size,
            color: row.packaging_material_color,
            unit: row.packaging_material_unit,
            length_cm: row.packaging_material_length_cm,
            width_cm: row.packaging_material_width_cm,
            height_cm: row.packaging_material_height_cm,
          }),
        }
        : null,
      
      warehouseInventory: row.warehouse_inventory_id && {
        id: row.warehouse_inventory_id,
        warehouseQuantity: row.warehouse_quantity,
        reservedQuantity: row.reserved_quantity,
        statusName: row.inventory_status_name,
        statusDate: row.inventory_status_date,
      },
      
      batch: (() => {
        if (row.batch_type === 'product') {
          return {
            type: 'product',
            productLotNumber: row.product_lot_number,
            productExpiryDate: row.product_expiry_date,
            productInboundDate: row.product_inbound_date,
          };
        } else if (row.batch_type === 'packaging_material') {
          return {
            type: 'packaging_material',
            materialLotNumber: row.material_lot_number,
            materialExpiryDate: row.material_expiry_date,
            snapshotName: row.material_name,
          };
        }
        return {
          type: row.batch_type,
        };
      })(),
    };
    
    return cleanObject(base);
  });
  
  return {
    header: cleanObject(header),
    items,
  };
};

/**
 * Transforms the raw order allocation result into a standardized response object.
 *
 * This function is typically used after performing allocation logic and updates,
 * converting the internal result format into a consistent API response structure.
 *
 * Ensures camelCase key formatting and returns only the relevant fields needed by the client.
 *
 * @param {Object} raw - Raw allocation result object from the service or business layer.
 * @param {string} raw.orderId - UUID of the order.
 * @param {string[]} raw.allocationIds - Array of allocation record UUIDs.
 * @param {string[]} raw.updatedWarehouseInventoryIds - IDs of updated warehouse_inventory rows.
 * @param {string[]} raw.logIds - IDs of created inventory activity logs.
 * @param {boolean} raw.fullyAllocated - Indicates whether all items were fully allocated.
 * @param {Array<{
 *   orderItemId: string,
 *   newStatus: string,
 *   isFullyAllocated: boolean
 * }>} raw.updatedItemStatuses - Per-item allocation status updates.
 *
 * @returns {{
 *   orderId: string,
 *   allocationIds: string[],
 *   updatedWarehouseInventoryIds: string[],
 *   logIds: string[],
 *   fullyAllocated: boolean,
 *   updatedItemStatuses: Array<{
 *     orderItemId: string,
 *     newStatus: string,
 *     isFullyAllocated: boolean
 *   }>
 * }} - Transformed allocation result ready for API response.
 *
 * @example
 * const response = transformOrderAllocationResponse(rawResult);
 * return res.status(200).json({ success: true, data: response });
 */
const transformOrderAllocationResponse = (raw) => {
  return {
    orderId: raw.orderId,
    allocationIds: raw.allocationIds,
    updatedWarehouseInventoryIds: raw.updatedWarehouseInventoryIds,
    logIds: raw.logIds,
    fullyAllocated: raw.fullyAllocated,
    updatedItemStatuses: raw.updatedItemStatuses.map((item) => ({
      orderItemId: item.orderItemId,
      newStatus: item.newStatus,
      isFullyAllocated: item.isFullyAllocated,
    })),
  };
};

module.exports = {
  extractOrderItemIdsByType,
  transformAllocationResultToInsertRows,
  transformAllocationReviewData,
  transformInventoryAllocationReviewRows,
  transformOrderAllocationResponse,
};

const {
  transformPaginatedResult,
  deriveInventoryStatusFlags,
} = require('../utils/transformer-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');
const { cleanObject } = require('../utils/object-utils');
const { differenceInDays } = require('date-fns');
const {
  transformInventoryRecordBase,
  transformInventoryRecordSummaryBase,
} = require('./transform-inventory-record-base');
// const { generateChecksum } = require('../utils/crypto-utils');

/**
 * Transforms raw KPI summary query result rows into structured output.
 *
 * @param {Array} rows - Raw rows returned from the KPI summary SQL query.
 * @returns {Array} An array of transformed KPI summary objects.
 */
const transformLocationInventoryKpiSummary = (rows = []) => {
  return rows.map((row) => ({
    batchType: row.batch_type, // 'product' | 'packaging_material' | 'total'

    totalProducts: Number(row.total_products ?? 0),
    totalMaterials: Number(row.total_materials ?? 0),

    locationsCount: Number(row.locations_count ?? 0),
    totalQuantity: Number(row.total_quantity ?? 0),
    totalReserved: Number(row.total_reserved ?? 0),
    totalAvailable: Number(row.total_available ?? 0),

    nearExpiryInventoryRecords: Number(row.near_expiry_inventory_records ?? 0),
    expiredInventoryRecords: Number(row.expired_inventory_records ?? 0),

    expiredProductBatches: Number(row.expired_product_batches ?? 0),
    expiredMaterialBatches: Number(row.expired_material_batches ?? 0),

    lowStockCount: Number(row.low_stock_count ?? 0),
  }));
};

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
    itemId: row.item_id,
    itemType: isProduct ? 'product' : 'packaging_material',
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
  transformPaginatedResult(
    paginatedResult,
    transformLocationInventorySummaryRow
  );

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

    item:
      row.batch_type === 'product'
        ? cleanObject({
            type: 'sku',
            id: row.sku_id,
            code: row.sku,
          })
        : cleanObject({
            type: 'material',
            id: row.material_id,
            code: row.material_code,
          }),

    lotNumber: row.lot_number,
    manufactureDate:
      row.product_manufacture_date || row.material_manufacture_date,
    expiryDate: row.product_expiry_date || row.material_expiry_date,

    quantity: cleanObject({
      locationQuantity: row.location_quantity,
      reserved: row.reserved_quantity,
      available: Math.max(
        (row.location_quantity || 0) - (row.reserved_quantity || 0),
        0
      ),
    }),

    status: cleanObject({
      id: row.status_id,
      name: row.status_name,
      date: row.status_date,
    }),

    timestamps: cleanObject({
      inboundDate: row.inbound_date,
      outboundDate: row.outbound_date,
      lastUpdate: row.last_update,
    }),
    durationInStorage: row.inbound_date
      ? differenceInDays(new Date(), new Date(row.inbound_date))
      : null,

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
  transformPaginatedResult(
    paginatedResult,
    transformLocationInventorySummaryDetailsItem
  );

/**
 * Transforms a single raw location inventory row into structured, display-ready data.
 * Dynamically handles both product and material item types.
 *
 * @param {Object} row - A raw DB row from the location inventory query
 * @returns {Object} Transformed and cleaned location inventory object
 */
const transformLocationInventoryRecord = (row) =>
  transformInventoryRecordBase(row, {
    idField: 'location_inventory_id',
    scopeKey: 'location',
    scopeIdField: 'location_id',
    scopeNameField: 'location_name',
    scopeTypeField: 'location_type_name',
    quantityField: 'location_quantity',
  });

/**
 * Transforms a paginated result set of raw location inventory rows into enriched, display-ready objects.
 *
 * This function applies `transformLocationInventoryRecord` to each record in the paginated result,
 * converting database field names into structured objects, deriving display names, and attaching status flags.
 *
 * @param {Object} paginatedResult - The raw paginated database result
 * @returns {Object} Transformed a paginated result with structured inventory data
 */
// todo: fix bugs: miss location name and type
const transformPaginatedLocationInventoryRecordResults = (paginatedResult) =>
  transformPaginatedResult(paginatedResult, transformLocationInventoryRecord);

/**
 * Transforms lightweight enriched location inventory records
 * (typically after insert or quantity adjustment) into a normalized response format.
 *
 * - Dynamically merges product or material info into a single `itemInfo` section.
 * - Normalizes for summary/confirmation UI.
 * - Strips null/undefined fields using `cleanObject`.
 *
 * @param {Array<Object>} rows - Raw DB rows from the location inventory join query.
 * @returns {Array<InventoryRecordOutput>} - Transformed summary records.
 */
const transformLocationInventoryResponseRecords = (rows) => {
  return transformInventoryRecordSummaryBase(rows, {
    quantityField: 'location_quantity',
    getProductDisplayName,
    cleanObject,
  });
};

// /**
//  * Builds a structured log entry object for an inventory allocation event.
//  *
//  * This function is used to record allocation-related changes to the `reserved_quantity`
//  * field in the `warehouse_inventory` table. It computes the quantity change, builds a
//  * metadata object with contextual details, and generates a checksum to ensure log integrity.
//  *
//  * The returned object is ready for insertion into the inventory activity log table.
//  *
//  * @param {Object} params - Allocation log parameters.
//  * @param {string} params.inventoryId - The ID of the warehouse inventory record.
//  * @param {number} params.previousReservedQty - The previous reserved quantity.
//  * @param {number} params.newReservedQty - The updated reserved quantity after allocation.
//  * @param {number} params.warehouseQty - The current warehouse quantity (for snapshot only).
//  * @param {string} params.statusId - Inventory status ID after allocation.
//  * @param {string} params.userId - The ID of the user performing the allocation.
//  * @param {string} params.orderId - The ID of the related order (if applicable).
//  * @param {string} params.inventoryActionTypeId - ID of the action type (e.g., "ALLOCATE").
//  * @param {string} [params.sourceType='order'] - Source of the change (e.g., 'order', 'manual').
//  * @param {string|null} [params.sourceRefId=null] - Reference ID from the source context.
//  * @param {string} [params.recordScope='warehouse'] - Scope of the record ('warehouse' or 'location').
//  * @param {string|null} [params.comments=null] - Optional comment describing the action.
//  * @param {object} [params.metadata={}] - Additional metadata for traceability.
//  *
//  * @returns {object} Inventory activity log object with checksum and full context.
//  */
// const buildAllocationLogEntry = ({
//                                    inventoryId,
//                                    previousReservedQty,
//                                    newReservedQty,
//                                    warehouseQty, // unchanged but included for reference
//                                    statusId,
//                                    userId,
//                                    orderId,
//                                    inventoryActionTypeId, // e.g., 'ALLOCATE'
//                                    sourceType = 'order',
//                                    sourceRefId = null,
//                                    recordScope = 'warehouse',
//                                    comments = null,
//                                    metadata = {},
//                                  }) => {
//   const quantityChange = newReservedQty - previousReservedQty;
//
//   const checksumPayload = cleanObject({
//     warehouse_inventory_id: inventoryId,
//     inventory_action_type_id: inventoryActionTypeId,
//     adjustment_type_id: null, // not an adjustment
//     order_id: orderId || null,
//     quantity_change: quantityChange,
//     new_quantity: newReservedQty,
//     status_id: statusId,
//     performed_by: userId,
//     comments,
//     recorded_by: userId,
//     inventory_scope: recordScope,
//     source_type: sourceType,
//     source_ref_id: sourceRefId,
//     metadata: {
//       action: 'allocate',
//       warehouse_quantity_snapshot: warehouseQty,
//       record_scope: recordScope,
//       ...metadata,
//     },
//   });
//
//   return {
//     warehouse_inventory_id: inventoryId,
//     inventory_action_type_id: inventoryActionTypeId,
//     adjustment_type_id: null,
//     order_id: orderId || null,
//     previous_quantity: previousReservedQty,
//     quantity_change: quantityChange,
//     new_quantity: newReservedQty,
//     status_id: statusId,
//     performed_by: userId,
//     recorded_by: userId,
//     comments,
//     metadata: checksumPayload.metadata,
//     source_type: sourceType,
//     source_ref_id: sourceRefId,
//     inventory_scope: recordScope,
//     checksum: generateChecksum(checksumPayload),
//   };
// };

module.exports = {
  transformLocationInventoryKpiSummary,
  transformPaginatedLocationInventorySummaryResult,
  transformPaginatedLocationInventorySummaryDetails,
  transformPaginatedLocationInventoryRecordResults,
  transformLocationInventoryResponseRecords,
  buildAllocationLogEntry,
};

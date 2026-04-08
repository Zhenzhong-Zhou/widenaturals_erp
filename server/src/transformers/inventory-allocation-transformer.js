/**
 * @file inventory-allocation-transformer.js
 * @description Transformers for inventory allocation records.
 *
 * Exports:
 *   - extractOrderItemIdsByType                  – partitions order items into SKU and packaging IDs
 *   - transformAllocationResultToInsertRows       – converts allocation results into DB insert rows
 *   - transformAllocationReviewData              – builds minimal review summary from raw allocations
 *   - transformInventoryAllocationReviewRows     – transforms review rows into header + items shape
 *   - transformPaginatedInventoryAllocationResults – transforms paginated allocation result set
 *   - transformOrderAllocationResponse           – builds final allocation response shape
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { getFullName }                   = require('../utils/person-utils');
const { getProductDisplayName }         = require('../utils/display-name-utils');
const { formatPackagingMaterialLabel }  = require('../utils/packaging-material-utils');
const { cleanObject }                   = require('../utils/object-utils');
const {
  getBatchSummary,
  getWarehouseInventoryList,
}                                       = require('../utils/inventory-utils');
const { transformPageResult }           = require('../utils/transformer-utils');

/**
 * Partitions order items into unique SKU IDs and packaging material IDs.
 *
 * @param {Array<Object>} [items=[]]
 * @returns {{ skuIds: string[], packagingMaterialIds: string[] }}
 */
const extractOrderItemIdsByType = (items = []) => {
  const skuIds               = [];
  const packagingMaterialIds = [];
  
  for (const item of items) {
    if (item.sku_id)               skuIds.push(item.sku_id);
    if (item.packaging_material_id) packagingMaterialIds.push(item.packaging_material_id);
  }
  
  return {
    skuIds:               [...new Set(skuIds)],
    packagingMaterialIds: [...new Set(packagingMaterialIds)],
  };
};

/**
 * Converts allocation results into flat DB insert rows with audit metadata.
 *
 * Skips entries with missing IDs or zero allocated quantity.
 *
 * @param {Array<Object>} allocationResult
 * @param {Object}        [options={}] - Additional fields merged into each row (e.g. status_id, created_by).
 * @returns {Array<Object>}
 */
const transformAllocationResultToInsertRows = (allocationResult, options = {}) => {
  if (!Array.isArray(allocationResult)) return [];
  
  const rows = [];
  
  for (const item of allocationResult) {
    const { order_item_id } = item;
    const batches = item?.allocated?.allocatedBatches ?? item?.allocatedBatches ?? [];
    
    for (const batch of batches) {
      const qty = Number(batch?.allocated_quantity ?? 0);
      
      if (!order_item_id || !batch?.batch_id || !batch?.warehouse_id || qty <= 0) continue;
      
      rows.push({
        order_item_id,
        transfer_order_item_id: null,
        warehouse_id:       batch.warehouse_id,
        batch_id:           batch.batch_id,
        allocated_quantity: qty,
        ...options,
      });
    }
  }
  
  return rows;
};

/**
 * Builds a minimal review summary from raw inserted allocation rows.
 *
 * @param {Array<{ id: string }>} rows
 * @param {string}                orderId
 * @returns {{ orderId: string, allocationIds: string[] }}
 */
const transformAllocationReviewData = (rows, orderId) => ({
  orderId,
  allocationIds: rows.map((row) => row.id),
});

/**
 * Transforms raw inventory allocation review rows into a header + items shape.
 *
 * Returns `null` if the input is empty.
 *
 * @param {InventoryAllocationReviewRow[]} rows
 * @returns {{ header: Object, items: Array<Object> }|null}
 */
const transformInventoryAllocationReviewRows = (rows = []) => {
  if (!rows.length) return null;
  
  const [first] = rows;
  
  const header = cleanObject({
    orderNumber: first.order_number,
    note:        first.order_note,
    orderStatus: {
      id:   first.order_status_id,
      name: first.order_status_name,
      code: first.order_status_code,
    },
    salesperson: {
      id:       first.salesperson_id,
      fullName: getFullName(first.salesperson_firstname, first.salesperson_lastname),
    },
  });
  
  const items = rows.map((row) => {
    const batch  = getBatchSummary(row);
    const wiList = getWarehouseInventoryList(row);
    
    return cleanObject({
      allocationId:         row.allocation_id,
      orderItemId:          row.order_item_id,
      transferOrderItemId:  row.transfer_order_item_id,
      batchId:              row.batch_id,
      allocatedQuantity:    row.allocated_quantity,
      allocationStatusId:   row.allocation_status_id,
      allocationStatusName: row.allocation_status_name,
      allocationStatusCode: row.allocation_status_code,
      createdAt:            row.allocation_created_at,
      updatedAt:            row.allocation_updated_at,
      
      createdBy: {
        id:       row.allocation_created_by,
        fullName: getFullName(row.allocation_created_by_firstname, row.allocation_created_by_lastname),
      },
      updatedBy: {
        id:       row.allocation_updated_by,
        fullName: getFullName(row.allocation_updated_by_firstname, row.allocation_updated_by_lastname),
      },
      
      orderItem: {
        id:               row.order_item_id,
        orderId:          row.order_id,
        quantityOrdered:  row.quantity_ordered,
        statusId:         row.item_status_id,
        statusName:       row.item_status_name,
        statusCode:       row.item_status_code,
        statusDate:       row.item_status_date,
      },
      
      product: row.product_id
        ? {
          productId:   row.product_id,
          skuId:       row.sku_id,
          skuCode:     row.sku,
          barcode:     row.barcode,
          displayName: row.sku_id
            ? getProductDisplayName({
              brand:        row.brand,
              sku:          row.sku,
              country_code: row.country_code,
              product_name: row.product_name,
              size_label:   row.size_label,
            })
            : null,
        }
        : null,
      
      packagingMaterial: row.packaging_material_id
        ? {
          id:    row.packaging_material_id,
          code:  row.packaging_material_code,
          label: formatPackagingMaterialLabel({
            name:      row.packaging_material_name,
            size:      row.packaging_material_size,
            color:     row.packaging_material_color,
            unit:      row.packaging_material_unit,
            length_cm: row.packaging_material_length_cm,
            width_cm:  row.packaging_material_width_cm,
            height_cm: row.packaging_material_height_cm,
          }),
        }
        : null,
      
      warehouseInventoryList: wiList.map((wi) =>
        cleanObject({
          id:               wi.warehouse_inventory_id,
          warehouseQuantity: wi.warehouse_quantity,
          reservedQuantity:  wi.reserved_quantity,
          statusName:        wi.inventory_status_name,
          statusDate:        wi.inventory_status_date,
          warehouseName:     wi.warehouse_name,
          inboundDate:       wi.inbound_date,
        })
      ),
      
      batch,
    });
  });
  
  return { header, items };
};

/**
 * Transforms a single paginated inventory allocation DB row into the UI-facing shape.
 *
 * @param {InventoryAllocationRow} row
 * @returns {InventoryAllocationSummary}
 */
const transformInventoryAllocationRow = (row) =>
  cleanObject({
    orderId:       row.order_id,
    orderNumber:   row.order_number,
    orderType:     row.order_type,
    orderCategory: row.order_category,
    orderStatus: {
      name: row.order_status_name,
      code: row.order_status_code,
    },
    customer: {
      fullName: getFullName(row.customer_firstname, row.customer_lastname),
    },
    paymentMethod: row.payment_method   ?? null,
    paymentStatus: {
      name: row.payment_status_name ?? null,
      code: row.payment_status_code ?? null,
    },
    deliveryMethod: row.delivery_method ?? null,
    
    orderCreatedAt: row.created_at,
    orderCreatedBy: getFullName(row.created_by_firstname, row.created_by_lastname),
    orderUpdatedAt: row.updated_at,
    orderUpdatedBy: getFullName(row.updated_by_firstname, row.updated_by_lastname),
    
    itemCount: {
      total:     row.total_items    ?? 0,
      allocated: row.allocated_items ?? 0,
    },
    
    warehouses: {
      ids:   row.warehouse_ids   ?? [],
      names: row.warehouse_names ?? '',
    },
    
    allocationStatus: {
      codes:   row.allocation_status_codes ?? [],
      names:   row.allocation_statuses     ?? '',
      summary: row.allocation_summary_status ?? 'Unknown',
    },
    
    allocationIds:      row.allocation_ids      ?? [],
    allocatedAt:        row.allocated_at,
    allocatedCreatedAt: row.allocated_created_at,
  });

/**
 * Transforms a paginated inventory allocation result set into the UI-facing shape.
 *
 * @param {Object}                    paginatedResult
 * @param {InventoryAllocationRow[]}  paginatedResult.data
 * @param {Object}                    paginatedResult.pagination
 * @returns {Promise<PaginatedResult<InventoryAllocationRow>>}
 */
const transformPaginatedInventoryAllocationResults = (paginatedResult) =>
  /** @type {Promise<PaginatedResult<InventoryAllocationRow>>} */
  (transformPageResult(paginatedResult, transformInventoryAllocationRow));

/**
 * Builds the final order allocation response shape from the business result.
 *
 * @param {Object} raw - Output of `buildOrderAllocationResult`.
 * @returns {Object}
 */
const transformOrderAllocationResponse = (raw) => ({
  orderId:                    raw.orderId,
  allocationIds:              raw.allocationIds,
  updatedWarehouseInventoryIds: raw.updatedWarehouseInventoryIds,
  logIds:                     raw.logIds,
  fullyAllocated:             raw.fullyAllocated,
  updatedItemStatuses:        raw.updatedItemStatuses.map((item) => ({
    orderItemId:      item.orderItemId,
    newStatus:        item.newStatus,
    isFullyAllocated: item.isFullyAllocated,
  })),
});

module.exports = {
  extractOrderItemIdsByType,
  transformAllocationResultToInsertRows,
  transformAllocationReviewData,
  transformInventoryAllocationReviewRows,
  transformPaginatedInventoryAllocationResults,
  transformOrderAllocationResponse,
};

const { cleanObject } = require('../utils/object-utils');

/**
 * Transforms raw fulfillment-related rows into a normalized business-layer result object.
 *
 * Business rule:
 *  - A fulfillment result must include updated order/shipment/fulfillment metadata,
 *    inventory adjustments, and status updates in a single structured object.
 *  - Designed for use as the return value of outbound fulfillment services.
 *
 * Usage:
 *  - Call at the end of a fulfillment transaction after all inserts and updates complete.
 *  - Intended to provide a clean DTO (data transfer object) for service responses.
 *
 * Performance:
 *  - O(n) where n = number of warehouse inventory IDs or order item status rows.
 *  - Already optimized: minimal property lookups and array mappings.
 *
 * @async
 * @function
 * @param {Object} params - Input payload for transformation
 * @param {string} params.orderId - Order ID
 * @param {Object} params.shipmentRow - Shipment row from DB
 * @param {Object} params.fulfillmentRow - Fulfillment row from DB
 * @param {Object} params.shipmentBatchRow - Shipment batch row from DB
 * @param {Object[]} params.warehouseInventoryIds - Updated warehouse inventory rows
 * @param {Object} params.orderStatusRow - Updated order status row
 * @param {Object[]} params.orderItemStatusRow - Updated order item status rows
 * @param {Object[]} params.inventoryAllocationStatusRow - Updated allocation status rows
 * @param {Object} params.logMetadata - Metadata from inserted inventory logs
 * @returns {Object} Normalized fulfillment result containing:
 *  - {string} orderId
 *  - {Object} orderStatus {id, updatedAt}
 *  - {Object} shipment {id, batchId}
 *  - {Object} fulfillment {id, statusId}
 *  - {Object} inventory {updatedWarehouseInventoryIds, activityLogIds, logCounts}
 *  - {Object} statusUpdates {updatedOrderItemStatusIds, updatedAllocationStatusIds}
 */
const transformFulfillmentResult = ({
                                      orderId,
                                      shipmentRow,
                                      fulfillmentRow,
                                      shipmentBatchRow,
                                      warehouseInventoryIds,
                                      orderStatusRow,
                                      orderItemStatusRow,
                                      inventoryAllocationStatusRow,
                                      logMetadata,
                                    }) => {
  const result = {
    orderId,
    orderStatus: {
      id: orderStatusRow?.order_status_id ?? null,
      updatedAt: orderStatusRow?.status_date ?? null,
    },
    shipment: {
      id: shipmentRow?.id ?? null,
      batchId: shipmentBatchRow?.id ?? null,
    },
    fulfillment: {
      id: fulfillmentRow?.id ?? null,
      statusId: fulfillmentRow?.status_id ?? null,
    },
    inventory: {
      updatedWarehouseInventoryIds: warehouseInventoryIds.map(row => row.id),
      activityLogIds: logMetadata?.activityLogIds ?? [],
      logCounts: {
        activity: logMetadata?.insertedActivityCount ?? 0,
        audit: logMetadata?.insertedAuditCount ?? 0,
        warehouseAudit: logMetadata?.warehouseAuditCount ?? 0,
        locationAudit: logMetadata?.locationAuditCount ?? 0,
      },
    },
    statusUpdates: {
      updatedOrderItemStatusIds: orderItemStatusRow?.map(row => row.id) ?? [],
      updatedAllocationStatusIds: inventoryAllocationStatusRow ?? [],
    },
  };
  
  return cleanObject(result);
};

module.exports = {
  transformFulfillmentResult,
};

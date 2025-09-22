const { cleanObject } = require('../utils/object-utils');

/**
 * Transforms raw DB rows into a normalized fulfillment result object.
 *
 * Business rules:
 *  - Combines order, shipment, fulfillment, and status update metadata into
 *    a clean DTO for outbound fulfillment responses.
 *  - Excludes inventory/log metadata (handled separately in adjustment flows).
 *
 * Usage:
 *  - Call at the end of `fulfillOutboundShipmentService` after DB inserts/updates.
 *  - Provides a minimal but structured response to the client or service layer.
 *
 * Performance:
 *  - O(n) where n = number of order item status rows.
 *  - Optimized: single-pass mapping for order item IDs.
 *
 * @function
 * @param {Object} params - Input payload for transformation
 * @param {string} params.orderId - Order ID
 * @param {Object} params.shipmentRow - Inserted shipment row
 * @param {Object} params.fulfillmentRowWithStatus - Inserted fulfillment row
 * @param {Object} params.shipmentBatchRow - Inserted shipment batch row
 * @param {Object} params.orderStatusRow - Updated order status row
 * @param {Object[]} params.orderItemStatusRow - Updated order item status rows
 * @returns {Object} Fulfillment result object:
 *  - {string} orderId
 *  - {Object} orderStatus { id, updatedAt }
 *  - {Object} shipment { id, batchId }
 *  - {Object} fulfillment { id, statusId }
 *  - {Object} statusUpdates { updatedOrderItemStatusIds }
 */
const transformFulfillmentResult = ({
                                      orderId,
                                      shipmentRow,
                                      fulfillmentRowWithStatus,
                                      shipmentBatchRow,
                                      orderStatusRow,
                                      orderItemStatusRow,
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
      id: fulfillmentRowWithStatus?.id ?? null,
      statusId: fulfillmentRowWithStatus?.status_id ?? null,
    },
    statusUpdates: {
      updatedOrderItemStatusIds: orderItemStatusRow?.map(row => row.id) ?? [],
    },
  };
  
  return cleanObject(result);
};

/**
 * Transforms raw fulfillment adjustment data into a structured result object.
 *
 * Business rules:
 *  - Provides a consolidated DTO containing order, shipment, fulfillment,
 *    inventory, and status update metadata after an adjustment.
 *  - Ensures logs and all related status transitions are returned together
 *    for traceability and auditing.
 *
 * Usage:
 *  - Call at the end of `adjustInventoryForFulfillmentService` after all
 *    inventory updates, status updates, and logs have been committed.
 *  - Intended to be returned as the service response.
 *
 * Performance:
 *  - O(n) where n = number of fulfillment records mapped.
 *  - Minimal overhead: simple object construction and array mapping.
 *
 * @function
 * @param {Object} params - Input payload for transformation
 * @param {string} params.orderId - ID of the order
 * @param {string} params.orderNumber - Human-readable order number
 * @param {Object[]} params.fulfillments - Fulfillment rows from DB
 * @param {string} params.shipmentId - ID of the outbound shipment
 * @param {string[]} params.warehouseInventoryIds - IDs of updated warehouse inventory records
 * @param {Object} params.orderStatusRow - Updated order status row
 * @param {Object[]} params.orderItemStatusRow - Updated order item status rows
 * @param {Object[]} params.inventoryAllocationStatusRow - Updated allocation status rows
 * @param {Object[]} params.orderFulfillmentStatusRow - Updated fulfillment status rows
 * @param {Object[]} params.shipmentStatusRow - Updated shipment status rows
 * @param {Object[]} params.logMetadata - Inserted inventory activity log metadata
 * @returns {Object} Structured fulfillment adjustment result:
 *  - {Object} order { id, number }
 *  - {Object} shipment { id, statuses }
 *  - {Object[]} fulfillments { id, statusId }
 *  - {Object} inventory { updatedWarehouseIds }
 *  - {Object} statuses { order, orderItems, allocations, fulfillments, shipments }
 *  - {Object[]} logs
 */
const transformAdjustedFulfillmentResult = ({
                                              orderId,
                                              orderNumber,
                                              fulfillments,
                                              shipmentId,
                                              warehouseInventoryIds,
                                              orderStatusRow,
                                              orderItemStatusRow,
                                              inventoryAllocationStatusRow,
                                              orderFulfillmentStatusRow,
                                              shipmentStatusRow,
                                              logMetadata,
                                            }) => {
  return {
    order: {
      id: orderId,
      number: orderNumber,
    },
    shipment: {
      id: shipmentId,
      statuses: shipmentStatusRow,
    },
    fulfillments: fulfillments.map(f => ({
      id: f.fulfillment_id,
      statusId: f.status_id,
    })),
    inventory: {
      updatedWarehouseIds: warehouseInventoryIds,
    },
    statuses: {
      order: orderStatusRow,
      orderItems: orderItemStatusRow,
      allocations: inventoryAllocationStatusRow,
      fulfillments: orderFulfillmentStatusRow,
      shipments: shipmentStatusRow,
    },
    logs: logMetadata,
  };
};

module.exports = {
  transformFulfillmentResult,
  transformAdjustedFulfillmentResult,
};

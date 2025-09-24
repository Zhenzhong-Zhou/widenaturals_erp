const { cleanObject } = require('../utils/object-utils');
const { getFullName } = require('../utils/name-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');

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

/**
 * Transforms a single raw outbound shipment SQL row into a clean, API-ready object.
 *
 * ### Input
 * A flat SQL row returned from `getPaginatedOutboundShipmentRecords`, containing:
 * - Shipment-level fields (id, status, notes, shipment_details, dates)
 * - Order-level fields (order_id, order_number)
 * - Warehouse info (warehouse_id, warehouse_name)
 * - Delivery method and tracking number (joined metadata)
 * - Audit fields (created/updated timestamps and usernames)
 *
 * ### Output
 * A normalized object with nested structures for:
 * - `shipmentId`
 * - `order` → `{ id, number }`
 * - `warehouse` → `{ id, name }`
 * - `deliveryMethod` → `{ id, name } | null`
 * - `trackingNumber` → `{ id, number } | null`
 * - `status` → `{ id, code, name }`
 * - `dates` → `{ shippedAt, expectedDelivery }`
 * - `notes` and `shipmentDetails`
 * - `audit` → `{ createdAt, createdBy, updatedAt, updatedBy }`
 *
 * @param {Record<string, any>} row - Raw SQL row object
 * @returns {Record<string, any>} Clean API-ready outbound shipment object
 */
const transformOutboundShipmentRow = (row) => {
  const base = {
    shipmentId: row.shipment_id,
    order: {
      id: row.order_id,
      number: row.order_number,
    },
    warehouse: {
      id: row.warehouse_id,
      name: row.warehouse_name ?? null,
    },
    deliveryMethod: row.delivery_method
      ? {
        id: row.delivery_method_id,
        name: row.delivery_method,
      }
      : null,
    trackingNumber: row.tracking_number
      ? {
        id: row.tracking_number_id,
        number: row.tracking_number,
      }
      : null,
    status: {
      id: row.status_id,
      code: row.status_code,
      name: row.status_name,
    },
    dates: {
      shippedAt: row.shipped_at ?? null,
      expectedDelivery: row.expected_delivery_date ?? null,
    },
    notes: row.notes ?? null,
    shipmentDetails: row.shipment_details ?? null, // JSONB
    audit: {
      createdAt: row.created_at,
      createdBy: {
        id: row.created_by,
        fullName: getFullName(row.created_by_firstname, row.created_by_lastname),
      },
      updatedAt: row.updated_at,
      updatedBy: {
        id: row.updated_by,
        fullName: getFullName(row.updated_by_firstname, row.updated_by_lastname),
      },
    },
  };
  
  return cleanObject(base);
};

/**
 * Transforms a paginated set of outbound shipment rows into API-ready format.
 *
 * Wraps `transformOutboundShipmentRow` for each row and preserves pagination metadata.
 *
 * ### Input
 * - `paginatedResult` → `{ data: SQLRow[], pagination: { page, limit, totalRecords, totalPages } }`
 *
 * ### Output
 * - `{ data: TransformedOutboundShipment[], pagination }`
 *
 * @param {{
 *   data: Record<string, any>[];
 *   pagination: { page: number; limit: number; totalRecords: number; totalPages: number };
 * }} paginatedResult - The raw paginated result from the repository
 * @returns {{
 *   data: Record<string, any>[];
 *   pagination: { page: number; limit: number; totalRecords: number; totalPages: number };
 * }} Cleaned paginated outbound shipment results
 */
const transformPaginatedOutboundShipmentResults = (paginatedResult) => {
  return transformPaginatedResult(paginatedResult, (row) =>
    transformOutboundShipmentRow(row)
  );
};

module.exports = {
  transformFulfillmentResult,
  transformAdjustedFulfillmentResult,
  transformPaginatedOutboundShipmentResults,
};

const { withTransaction } = require('../database/db');
const AppError = require('../utils/AppError');
const { getOrderTypeMetaByOrderId } = require('../repositories/order-type-repository');
const { getSalesOrderShipmentMetadata } = require('../repositories/order-repository');
const { insertOrderFulfillmentsBulk } = require('../repositories/order-fulfillment-repository');
const { insertShipmentBatchesBulk } = require('../repositories/shipment-batch-repository');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const { getWarehouseInventoryQuantities, bulkUpdateWarehouseQuantities } = require('../repositories/warehouse-inventory-repository');
const { getOrderStatusByCode } = require('../repositories/order-status-repository');
const { insertInventoryActivityLogs } = require('../repositories/inventory-log-repository');
const { getInventoryActionTypeId } = require('../repositories/inventory-action-type-repository');
const { transformFulfillmentResult } = require('../transformers/outbound-fulfillment-transformer');
const {
  validateOrderIsFullyAllocated,
  getAndLockAllocations,
  assertSingleWarehouseAllocations,
  insertOutboundShipmentRecord,
  buildFulfillmentInputsFromAllocations,
  buildShipmentBatchInputs,
  enrichAllocationsWithInventory,
  calculateInventoryAdjustments,
  updateAllStatuses,
  buildInventoryActivityLogs
} = require('../business/outbound-fulfillment-business');

/**
 * Service: fulfillOutboundShipmentService
 *
 * Orchestrates the fulfillment of an outbound shipment for a given order.
 * This service ensures transactional consistency across allocations,
 * shipments, inventory, and logs by executing within a single database transaction.
 *
 * Workflow:
 *  1. Validate that the order is fully allocated before fulfillment.
 *  2. Fetch allocation metadata and apply row-level locks (FOR UPDATE).
 *  3. Enforce single-warehouse rule; determine shipment metadata.
 *  4. Insert an outbound shipment record.
 *  5. Insert fulfillment records (aggregated by order_item_id + shipment_id).
 *  6. Insert shipment batch records linking batches to the shipment.
 *  7. Update warehouse inventory quantities and reserved counts.
 *  8. Update statuses for order, order items, and allocations.
 *  9. Insert inventory activity logs for audit/history.
 * 10. Transform and return the full fulfillment result.
 *
 * Business rules:
 *  - Fulfillment is only allowed when all order items are fully allocated.
 *  - Allocations spanning multiple warehouses must be fulfilled separately.
 *  - Shipment, fulfillment, and batch records are always linked for traceability.
 *
 * @param {Object} requestData - Fulfillment request data
 * @param {string} requestData.orderId - ID of the order being fulfilled
 * @param {Object} requestData.allocations - Allocation info
 * @param {string[]} requestData.allocations.ids - Allocation IDs to fulfill
 * @param {string} [requestData.fulfillmentNotes] - Optional notes for fulfillment
 * @param {string} [requestData.shipmentNotes] - Optional notes for shipment
 * @param {string} [requestData.shipmentBatchNote] - Optional notes for shipment batches
 *
 * @param {Object} user - Authenticated user object
 * @param {string} user.id - ID of the user performing fulfillment
 *
 * @returns {Promise<Object>} Fulfillment result containing:
 *  - orderId
 *  - shipmentRow
 *  - fulfillmentRow
 *  - shipmentBatchRow
 *  - warehouseInventoryIds
 *  - orderStatusRow
 *  - orderItemStatusRow
 *  - inventoryAllocationStatusRow
 *  - logMetadata
 *
 * @throws {AppError} Validation error if the order is not fully allocated,
 *         or service/database error if fulfillment cannot be completed.
 */
const fulfillOutboundShipmentService = async (requestData, user) => {
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      const { orderId, allocations, fulfillmentNotes, shipmentNotes, shipmentBatchNote } = requestData;
      
      // 1. Validate
      await validateOrderIsFullyAllocated(orderId, client);
      
      // 2. Fetch + lock allocations
      const allocationMeta = await getAndLockAllocations(orderId, allocations.ids, client);
      const warehouseId = assertSingleWarehouseAllocations(allocationMeta);
      
      // 3. Get order metadata (sales order, etc.)
      const { order_id, order_number, order_type_category } = await getOrderTypeMetaByOrderId(orderId, client);
      
      let shipmentMeta = {};
      if (order_type_category === 'sales') {
        shipmentMeta = await getSalesOrderShipmentMetadata(order_id, client);
      }
      
      // 4. Insert outbound shipment
      const shipmentRow = await insertOutboundShipmentRecord(
        order_id,
        warehouseId,
        shipmentMeta.delivery_method_id,
        shipmentNotes,
        userId,
        client
      );
      
      // 5. Insert fulfillments
      const fulfillmentInputs = buildFulfillmentInputsFromAllocations(allocationMeta, shipmentRow.id, userId, fulfillmentNotes);
      const [fulfillmentRow] = await insertOrderFulfillmentsBulk(fulfillmentInputs, client);
      
      // 6. Insert shipment batches
      const shipmentBatchInputs = buildShipmentBatchInputs(allocationMeta, shipmentRow.id, shipmentBatchNote, userId);
      const [shipmentBatchRow] = await insertShipmentBatchesBulk(shipmentBatchInputs, client);
      
      // 7. Update inventory quantities
      const inventoryMeta = await getWarehouseInventoryQuantities(
        allocationMeta.map(({ batch_id, warehouse_id }) => ({ warehouse_id: warehouse_id, batch_id: batch_id })), client
      );
      const enrichedAllocations = enrichAllocationsWithInventory(allocationMeta, inventoryMeta);
      const updatesObject = calculateInventoryAdjustments(enrichedAllocations);
      const warehouseInventoryIds = await bulkUpdateWarehouseQuantities(updatesObject, userId, client);
      
      // 8. Update statuses
      const {
        id: newStatusId,
      } = await getOrderStatusByCode('ORDER_PROCESSING', client);
      const { orderStatusRow, orderItemStatusRow, inventoryAllocationStatusRow } =
        await updateAllStatuses(order_id, allocationMeta, newStatusId, userId, client);
      
      // 9. Insert activity logs
      const inventoryActionTypeId = await getInventoryActionTypeId('reserve', client);
      const logs = buildInventoryActivityLogs(enrichedAllocations, updatesObject, {
        inventoryActionTypeId,
        userId,
        orderId,
        shipmentId: shipmentRow.id,
        fulfillmentId: fulfillmentRow.id,
        fulfillmentNotes,
        orderNumber: order_number,
      });
      const logMetadata = await insertInventoryActivityLogs(logs, client);
      
      logSystemInfo('Successfully fulfilled outbound shipment', {
        context: 'outbound-fulfillment-service/fulfillOutboundShipmentService',
        orderId,
        shipmentId: shipmentRow.id,
        userId,
      });
      
      // 10. Transform + return
      return transformFulfillmentResult({
        orderId,
        shipmentRow,
        fulfillmentRow,
        shipmentBatchRow,
        warehouseInventoryIds,
        orderStatusRow,
        orderItemStatusRow,
        inventoryAllocationStatusRow,
        logMetadata,
      });
    });
  } catch (error) {
    logSystemException(error, 'Failed to fulfill outbound shipment', {
      context: 'outbound-fulfillment-service/fulfillOutboundShipmentService',
      orderId: requestData?.orderId,
      userId: user?.id,
    });
    throw AppError.serviceError('Unable to fulfill outbound shipment.', {
      cause: error,
      context: 'outbound-fulfillment-service/fulfillOutboundShipmentService',
    });
  }
};

module.exports = {
  fulfillOutboundShipmentService,
};

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
  buildInventoryActivityLogs,
} = require('../business/outbound-fulfillment-business');
const { getAllocationStatuses } = require('../repositories/inventory-allocations-repository');
const { validateAllocationStatusTransition } = require('../business/inventory-allocation-business');

/**
 * Service: fulfillOutboundShipmentService
 *
 * Orchestrates the fulfillment of an outbound shipment for a given order.
 * Ensures full transactional consistency across allocations, shipments,
 * inventory updates, and logging — all executed within a single transaction.
 *
 * Validation & Business Rules:
 *  - Fulfillment is allowed **only** if all order items are fully allocated.
 *  - Each allocation must be in a valid status for transition to `ALLOC_FULFILLING`.
 *  - Fulfillment cannot proceed from a finalized allocation or fulfillment status.
 *  - Allocations spanning multiple warehouses are **not allowed** for a single fulfillment.
 *  - Shipment, fulfillment, and batch records are linked for full traceability.
 *
 * Workflow:
 *  1. Validate:
 *     - The order is fully allocated (no partially or unallocated items).
 *     - Each allocation's current status allows transition to `ALLOC_FULFILLING`.
 *  2. Fetch allocation metadata and apply row-level locking (`FOR UPDATE`).
 *  3. Assert allocations belong to a single warehouse.
 *  4. Conditionally fetch delivery metadata depending on order type.
 *  5. Insert a new outbound shipment record.
 *  6. Insert fulfillment records grouped by `order_item_id + shipment_id`.
 *  7. Insert shipment batch records linking batch and shipment.
 *  8. Adjust warehouse inventory quantities based on allocations.
 *  9. Update allocation, order item, and order statuses.
 * 10. Insert inventory activity logs for audit tracking.
 * 11. Return the full structured fulfillment result.
 *
 * @param {Object} requestData - Fulfillment request payload
 * @param {string} requestData.orderId - ID of the order to fulfill
 * @param {Object} requestData.allocations - Allocation-related data
 * @param {string[]} requestData.allocations.ids - Allocation IDs to fulfill
 * @param {string} [requestData.fulfillmentNotes] - Optional notes for the fulfillment
 * @param {string} [requestData.shipmentNotes] - Optional notes for the shipment
 * @param {string} [requestData.shipmentBatchNote] - Optional notes for shipment batches
 *
 * @param {Object} user - Authenticated user object
 * @param {string} user.id - ID of the user initiating the fulfillment
 *
 * @returns {Promise<Object>} Fulfillment result object:
 *  - orderId: ID of the fulfilled order
 *  - shipmentRow: Inserted shipment record
 *  - fulfillmentRow: Inserted fulfillment record(s)
 *  - shipmentBatchRow: Inserted shipment batch record(s)
 *  - warehouseInventoryIds: Updated warehouse inventory record IDs
 *  - orderStatusRow: Updated order status
 *  - orderItemStatusRow: Updated order item statuses
 *  - inventoryAllocationStatusRow: Updated allocation statuses
 *  - logMetadata: Inserted inventory activity logs
 *
 * @throws {AppError}
 *  - ValidationError: If allocation or fulfillment preconditions are not met
 *  - ServiceError: If fulfillment fails due to a system or database issue
 */
const fulfillOutboundShipmentService = async (requestData, user) => {
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      const {
        orderId: rawOrderId,
        allocations,
        fulfillmentNotes,
        shipmentNotes,
        shipmentBatchNote
      } = requestData;
      
      // 1. Validate that the order is fully allocated (no partial/missing allocations)
      await validateOrderIsFullyAllocated(rawOrderId, client);
      
      // 2. Fetch and lock allocations for the given order and allocation IDs
      const allocationMeta = await getAndLockAllocations(rawOrderId, allocations.ids, client);
      
      // 3. Ensure all allocations belong to the same warehouse
      const warehouseId = assertSingleWarehouseAllocations(allocationMeta);
      
      // 4. Validate allocation statuses — must be allowed to transition to ALLOC_FULFILLING
      const orderItemIds = allocationMeta.map(item => item.order_item_id);
      const allocationStatuses = await getAllocationStatuses(rawOrderId, orderItemIds,  client);
      allocationStatuses.forEach(({ allocation_status_code: code }) => {
        validateAllocationStatusTransition(code, 'ALLOC_FULFILLING');
      });
      
      const orderId = allocationStatuses[0]?.order_id;
      
      // 5. Fetch order metadata including type category and number
      const { order_id, order_number, order_type_category } = await getOrderTypeMetaByOrderId(orderId, client);
      
      // 6. Optionally fetch delivery method ID — varies by order type.
      // - For 'sales' orders, delivery method is stored in `sales_orders`.
      // - For 'transfer' orders, you may add logic later to fetch from `transfer_orders`.
      // - 'manufacturing' and other types do not require delivery info at this stage.
      let shipmentMeta = {};
      
      if (order_type_category === 'sales') {
        shipmentMeta = await getSalesOrderShipmentMetadata(order_id, client);
      } else if (order_type_category === 'transfer') {
        // TODO: Support transfer delivery method if needed.
        // shipmentMeta = await getTransferOrderShipmentMetadata(order_id, client);
      } else if (order_type_category === 'manufacturing') {
        // No delivery method required for manufacturing orders.
      } else {
        // Fallback: no shipment metadata.
        shipmentMeta = {};
      }
      
      // 7. Insert outbound shipment row
      const shipmentRow = await insertOutboundShipmentRecord(
        order_id,
        warehouseId,
        shipmentMeta.delivery_method_id,
        shipmentNotes,
        userId,
        client
      );
      
      // 8. Insert order fulfillment(s) for the allocation
      const fulfillmentInputs = buildFulfillmentInputsFromAllocations(
        allocationMeta,
        shipmentRow.id,
        userId,
        fulfillmentNotes
      );
      const [fulfillmentRow] = await insertOrderFulfillmentsBulk(
        fulfillmentInputs,
        client
      );
      
      // 9. Insert shipment batch linking the allocation and shipment
      const shipmentBatchInputs = buildShipmentBatchInputs(
        allocationMeta,
        shipmentRow.id,
        shipmentBatchNote,
        userId
      );
      const [shipmentBatchRow] = await insertShipmentBatchesBulk(
        shipmentBatchInputs,
        client
      );
      
      // 10. Fetch current inventory for each affected batch
      const inventoryMeta = await getWarehouseInventoryQuantities(
        allocationMeta.map(({ batch_id, warehouse_id }) => ({
          warehouse_id: warehouse_id,
          batch_id: batch_id
        })), client
      );
      
      // 11. Enrich allocations with inventory data for delta computation
      const enrichedAllocations = enrichAllocationsWithInventory(allocationMeta, inventoryMeta);
      
      // 12. Compute inventory adjustment deltas based on fulfillment (deduct reserved & actual qty)
      const updatesObject = calculateInventoryAdjustments(enrichedAllocations);
      
      // 13. Perform bulk inventory updates (adjust quantity and reserved_quantity)
      const warehouseInventoryIds = await bulkUpdateWarehouseQuantities(updatesObject, userId, client);
      
      // 14. Update statuses: Order, Order Items, and Allocations
      const {
        id: newStatusId,
      } = await getOrderStatusByCode('ORDER_PROCESSING', client);
      const { orderStatusRow, orderItemStatusRow, inventoryAllocationStatusRow } =
        await updateAllStatuses(order_id, allocationMeta, newStatusId, userId, client);
      
      // 15. Insert inventory activity logs for auditability
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
      
      // 16. Log success and return transformed result
      logSystemInfo('Successfully fulfilled outbound shipment', {
        context: 'outbound-fulfillment-service/fulfillOutboundShipmentService',
        orderId,
        shipmentId: shipmentRow.id,
        userId,
      });
      
      // 17. Transform + return
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

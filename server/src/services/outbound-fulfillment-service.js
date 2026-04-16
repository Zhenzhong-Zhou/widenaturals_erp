/**
 * @file outbound-fulfillment-service.js
 * @description Business logic for outbound fulfillment lifecycle operations.
 *
 * Exports:
 *   - fulfillOutboundShipmentService         – creates shipment and fulfillment records
 *   - confirmOutboundFulfillmentService      — confirms fulfillment, applies bulk inventory
 *                                              quantity updates and status resolution,
 *                                              and inserts inventory activity logs
 *   - fetchPaginatedOutboundFulfillmentService – paginated shipment list
 *   - fetchShipmentDetailsService            – full shipment detail with fulfillments and batches
 *   - completeManualFulfillmentService       – completes a manual/pickup fulfillment
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const { withTransaction }                    = require('../database/db');
const AppError                               = require('../utils/AppError');
const { getOrderTypeMetaByOrderId }          = require('../repositories/order-type-repository');
const {
  getSalesOrderShipmentMetadata,
  fetchOrderMetadata,
}                                            = require('../repositories/order-repository');
const {
  insertOrderFulfillmentsBulk,
  getOrderFulfillments,
}                                            = require('../repositories/order-fulfillment-repository');
const { insertShipmentBatchesBulk }          = require('../repositories/shipment-batch-repository');
const {
  getWarehouseInventoryQuantities, updateWarehouseInventoryQuantityBulk,
}                                            = require('../repositories/warehouse-inventory-repository');
const { getOrderStatusByCode }               = require('../repositories/order-status-repository');
const { getInventoryActionTypeId }           = require('../repositories/inventory-action-type-repository');
const {
  transformFulfillmentResult,
  transformAdjustedFulfillmentResult,
  transformPaginatedOutboundShipmentResults,
  transformShipmentDetailsRows,
  transformPickupCompletionResult,
}                                            = require('../transformers/outbound-fulfillment-transformer');
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
  assertOrderMeta,
  assertFulfillmentsValid,
  assertStatusesResolved,
  assertLogsGenerated,
  assertInventoryCoverage,
  assertEnrichedAllocations,
  assertInventoryAdjustments,
  assertActionTypeIdResolved,
  assertWarehouseUpdatesApplied,
  assertShipmentFound,
  validateStatusesBeforeConfirmation,
  validateStatusesBeforeManualFulfillment,
  assertDeliveryMethodIsAllowed,
}                                            = require('../business/outbound-fulfillment-business');
const { getAllocationStatuses }              = require('../repositories/inventory-allocations-repository');
const {
  validateAllocationStatusTransition,
}                                            = require('../business/inventory-allocation-business');
const { getShipmentStatusByCode }            = require('../repositories/shipment-status-repository');
const {
  getFulfillmentStatusByCode,
  getFulfillmentStatusesByIds,
}                                            = require('../repositories/fulfillment-status-repository');
const {
  getInventoryAllocationStatusId,
}                                            = require('../repositories/inventory-allocation-status-repository');
const {
  getPaginatedOutboundShipmentRecords,
  getShipmentDetailsById,
  getShipmentByShipmentId,
}                                            = require('../repositories/outbound-shipment-repository');
const { getOrderItemsByOrderId }             = require('../repositories/order-item-repository');
const { getStatusId } = require('../config/status-cache');
const { resolveInventoryStatus, buildFulfillmentLogEntry } = require('../business/warehouse-inventory-business');
const { insertInventoryActivityLogBulk } = require('../repositories/inventory-activity-log-repository');

const CONTEXT = 'outbound-fulfillment-service';

/**
 * Creates an outbound shipment record linked to order allocations.
 *
 * Validates full allocation, locks rows, inserts shipment, fulfillment,
 * and shipment batch records, then updates order and allocation statuses.
 *
 * @param {Object} requestData
 * @param {string} orderId
 * @param {Object} user
 * @returns {Promise<Object>}
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fulfillOutboundShipmentService = async (requestData, orderId, user) => {
  const context = `${CONTEXT}/fulfillOutboundShipmentService`;
  
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      const {
        allocations,
        fulfillmentNotes,
        shipmentNotes,
        shipmentBatchNote,
      } = requestData;
      
      const nextAllocationStepCode = 'ALLOC_FULFILLING';
      
      // 1. Validate order is fully allocated — no partial or missing allocations.
      await validateOrderIsFullyAllocated(orderId, client);
      
      // 2. Fetch and lock allocations for this order and allocation IDs.
      const { allocationMeta } = await getAndLockAllocations(orderId, allocations.ids, client);
      
      // 3. Ensure all allocations belong to the same warehouse.
      const warehouseId = assertSingleWarehouseAllocations(allocationMeta);
      
      // 4. Validate allocation statuses can transition to ALLOC_FULFILLING.
      const orderItemIds       = allocationMeta.map((item) => item.order_item_id);
      const allocationStatuses = await getAllocationStatuses(orderId, orderItemIds, client);
      
      allocationStatuses.forEach(({ allocation_status_code: code }) => {
        validateAllocationStatusTransition(code, nextAllocationStepCode);
      });
      
      // 5. Fetch order metadata including type category.
      const { order_id, order_type_category } = await getOrderTypeMetaByOrderId(orderId, client);
      
      // 6. Fetch delivery method — varies by order type category.
      let shipmentMeta = {};
      
      if (order_type_category === 'sales') {
        shipmentMeta = await getSalesOrderShipmentMetadata(order_id, client);
      }
      // transfer: TODO support transfer delivery method if needed.
      // manufacturing: no delivery method required at this stage.
      
      // 7. Insert outbound shipment record.
      const shipmentRow = await insertOutboundShipmentRecord(
        order_id,
        warehouseId,
        shipmentMeta.delivery_method_id,
        shipmentNotes,
        userId,
        client
      );
      
      // 8. Insert order fulfillments for the allocations.
      const fulfillmentInputs = buildFulfillmentInputsFromAllocations(
        allocationMeta,
        shipmentRow.id,
        userId,
        fulfillmentNotes
      );
      
      const fulfillmentRows = await insertOrderFulfillmentsBulk(fulfillmentInputs, client);
      
      if (!Array.isArray(fulfillmentRows) || !fulfillmentRows.length) {
        throw new Error('No fulfillment rows returned from insertOrderFulfillmentsBulk()');
      }
      
      const fulfillmentRowsWithStatus = fulfillmentRows.map((row, idx) => ({
        ...row,
        status_id: fulfillmentInputs[idx].status_id,
      }));
      
      // 9. Insert shipment batches linking each allocation to the shipment.
      const shipmentBatchInputs = allocationMeta.flatMap((meta) => {
        const fulfillment = fulfillmentRows.find((f) => f.order_item_id === meta.order_item_id);
        
        if (!fulfillment) {
          throw new Error(
            `No fulfillment found for allocation ${meta.id} (order_item_id=${meta.order_item_id})`
          );
        }
        
        return buildShipmentBatchInputs(
          [meta],
          shipmentRow.id,
          fulfillment.id,
          shipmentBatchNote,
          userId
        );
      });
      
      const [shipmentBatchRow] = await insertShipmentBatchesBulk(shipmentBatchInputs, client);
      
      // 10. Update order and allocation statuses.
      const { id: newStatusId } = await getOrderStatusByCode('ORDER_PROCESSING', client);
      const newAllocationStatusId = await getInventoryAllocationStatusId(nextAllocationStepCode, client);
      
      const { orderStatusRow, orderItemStatusRow } = await updateAllStatuses({
        orderId:              order_id,
        orderNumber:          shipmentMeta.order_number,
        allocationMeta,
        newOrderStatusId:     newStatusId,
        newAllocationStatusId,
        fulfillments:         [],
        newFulfillmentStatusId: null,
        newShipmentStatusId:  null,
        userId,
        client,
      });
      
      return transformFulfillmentResult({
        orderId,
        shipmentRow,
        fulfillmentRowsWithStatus,
        shipmentBatchRow,
        orderStatusRow,
        orderItemStatusRow,
      });
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to create outbound shipment.', {
      context,
      meta: { error: error.message }
    });
  }
};

/**
 * Confirms an outbound fulfillment for an order — adjusts warehouse inventory
 * quantities and status, updates order, item, allocation, fulfillment, and
 * shipment statuses, and inserts inventory activity logs within a single transaction.
 *
 * Flow:
 *  1. Validates order metadata and current status eligibility.
 *  2. Fetches and locks allocation and warehouse inventory rows.
 *  3. Validates fulfillment and shipment status eligibility.
 *  4. Enriches allocations with current inventory snapshot.
 *  5. Computes inventory quantity deltas per allocation.
 *  6. Resolves new inventory status per row and applies bulk quantity updates.
 *  7. Updates order, item, allocation, fulfillment, and shipment statuses.
 *  8. Builds and inserts inventory activity log entries for each quantity change.
 *
 * No warehouse ACL check required — warehouse scope is implicitly enforced
 * by the existing allocation records created during allocateInventoryForOrderService.
 *
 * @param {object} requestData
 * @param {string} requestData.orderStatus       - Target order status code.
 * @param {string} requestData.allocationStatus  - Target allocation status code.
 * @param {string} requestData.shipmentStatus    - Target shipment status code.
 * @param {string} requestData.fulfillmentStatus - Target fulfillment status code.
 * @param {string} orderId                       - UUID of the order to confirm fulfillment for.
 * @param {object} user                          - Authenticated user (requires `id`).
 *
 * @returns {Promise<object>} Transformed fulfillment confirmation response.
 *
 * @throws {AppError} `validationError`  — ineligible order, fulfillment, or shipment status.
 * @throws {AppError} `notFoundError`    — missing allocations, shipment, or status codes.
 * @throws {AppError} `businessError`   — empty enriched allocations or missing inventory adjustments.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `serviceError`.
 */
const confirmOutboundFulfillmentService = async (requestData, orderId, user) => {
  const context = `${CONTEXT}/confirmOutboundFulfillmentService`;
  
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      const {
        orderStatus,
        allocationStatus,
        shipmentStatus,
        fulfillmentStatus,
      } = requestData;
      
      // 1. Validate and fetch order metadata.
      const orderMeta = await getOrderTypeMetaByOrderId(orderId, client);
      assertOrderMeta(orderMeta);
      const { order_number: orderNumber } = orderMeta;
      
      const { order_status_code } = await fetchOrderMetadata(orderId, client);
      
      // 2. Fetch and lock allocations.
      const { allocationMeta, warehouseBatchKeys } = await getAndLockAllocations(orderId, null, client);
      
      // 3. Fetch and validate existing fulfillments.
      const fulfillments = await getOrderFulfillments({ orderId }, client);
      assertFulfillmentsValid(fulfillments, orderNumber);
      
      // 4. Resolve unique shipment ID — must be exactly one.
      const uniqueShipmentIds = [...new Set(fulfillments.map((f) => f.shipment_id))];
      
      if (uniqueShipmentIds.length > 1) {
        throw AppError.validationError(
          'Multiple shipment IDs detected — cannot confirm multiple shipments in a single transaction.'
        );
      }
      
      if (uniqueShipmentIds.length === 0) {
        throw AppError.notFoundError('No shipment found for the order fulfillments.');
      }
      
      const shipmentId = uniqueShipmentIds[0];
      
      // 5. Fetch shipment record.
      const shipment = /** @type {ShipmentRow} */ (
        await getShipmentByShipmentId(shipmentId, client)
      );
      assertShipmentFound(shipment, shipmentId);
      
      // 6. Fetch fulfillment status metadata.
      const fulfillmentStatusIds  = fulfillments.map((f) => f.status_id);
      const fulfillmentStatusMeta = await getFulfillmentStatusesByIds(fulfillmentStatusIds, client);
      
      // 7. Validate workflow eligibility before confirmation.
      validateStatusesBeforeConfirmation({
        orderStatusCode:     order_status_code,
        fulfillmentStatuses: fulfillmentStatusMeta.map((s) => s.code),
        shipmentStatusCode:  shipment.status_code,
      });
      
      // 8. Fetch inventory snapshot for affected batches.
      const inventoryMeta = await getWarehouseInventoryQuantities(warehouseBatchKeys, client);
      assertInventoryCoverage(inventoryMeta);
      
      // 9. Enrich allocations with current inventory data.
      const enrichedAllocations = enrichAllocationsWithInventory(allocationMeta, inventoryMeta);
      assertEnrichedAllocations(enrichedAllocations);
      
      // 10. Compute inventory deltas.
      const updates = calculateInventoryAdjustments(enrichedAllocations);
      assertInventoryAdjustments(updates);
      
      // 11. Apply bulk inventory updates.
      const inStockStatusId    = getStatusId('inventory_in_stock');
      const outOfStockStatusId = getStatusId('inventory_out_of_stock');
      
      const updateInputs = updates.map((row) => ({
        id:                row.id,
        warehouseQuantity: row.warehouse_quantity,
        reservedQuantity:  row.reserved_quantity,
        statusId:          resolveInventoryStatus(row.warehouse_quantity, {
          inStockStatusId,
          outOfStockStatusId,
        }),
      }));
      
      const updatedWarehouseRecords = await updateWarehouseInventoryQuantityBulk(
        updateInputs,
        userId,
        client
      );
      assertWarehouseUpdatesApplied(updatedWarehouseRecords, { updates: updateInputs });
      
      // 12. Resolve new status IDs.
      const { id: newOrderStatusId }       = await getOrderStatusByCode(orderStatus, client);
      const newAllocationStatusId          = await getInventoryAllocationStatusId(allocationStatus, client);
      const { id: newShipmentStatusId }    = await getShipmentStatusByCode(shipmentStatus, client);
      const { id: newFulfillmentStatusId } = await getFulfillmentStatusByCode(fulfillmentStatus, client);
      
      assertStatusesResolved({
        orderStatusId:       newOrderStatusId,
        shipmentStatusId:    newShipmentStatusId,
        fulfillmentStatusId: newFulfillmentStatusId,
      });
      
      // 13. Update statuses across all linked entities.
      const {
        orderStatusRow,
        orderItemStatusRow,
        inventoryAllocationStatusRow,
        orderFulfillmentStatusRow,
        shipmentStatusRow,
      } = await updateAllStatuses({
        orderId,
        orderNumber,
        allocationMeta,
        newOrderStatusId,
        newAllocationStatusId,
        fulfillments,
        newFulfillmentStatusId,
        newShipmentStatusId,
        userId,
        client,
      });
      
      // 14. Build and insert inventory activity logs.
      const inventoryActionTypeId = await getInventoryActionTypeId('fulfilled', client);
      assertActionTypeIdResolved(inventoryActionTypeId, 'fulfilled');
      
      const logs = fulfillments.flatMap((f) => {
        const allocation = enrichedAllocations.find((a) => a.allocation_id === f.allocation_id);
        const update     = updatedWarehouseRecords.find((r) => r.id === allocation?.warehouse_inventory_id);
        
        if (!allocation || !update) return [];
        
        return buildFulfillmentLogEntry({
          allocation,
          update,
          inventoryActionTypeId,
          userId,
          orderId,
          shipmentId:    f.shipment_id,
          fulfillmentId: f.fulfillment_id,
          orderNumber,
        });
      });
      
      assertLogsGenerated(logs, 'build');
      
      const logInsertResult = await insertInventoryActivityLogBulk(logs, client, { context });
      
      assertLogsGenerated(logInsertResult, 'insert');
      
      return transformAdjustedFulfillmentResult({
        orderId,
        orderNumber,
        fulfillments,
        shipmentId,
        warehouseInventoryIds:  updatedWarehouseRecords.map((r) => r.id),
        orderStatusRow,
        orderItemStatusRow,
        inventoryAllocationStatusRow,
        orderFulfillmentStatusRow,
        shipmentStatusRow,
        logMetadata:            logInsertResult,
      });
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to confirm outbound fulfillment.', {
      context,
      meta: { error: error.message }
    });
  }
};

/**
 * Fetches paginated outbound shipment records with optional filtering and sorting.
 *
 * @param {Object}        options
 * @param {Object}        [options.filters={}]
 * @param {number}        [options.page=1]
 * @param {number}        [options.limit=10]
 * @param {string}        [options.sortBy='createdAt']
 * @param {'ASC'|'DESC'}  [options.sortOrder='DESC']
 * @returns {Promise<PaginatedResult<Object>>}
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedOutboundFulfillmentService = async ({
                                                          filters   = {},
                                                          page      = 1,
                                                          limit     = 10,
                                                          sortBy    = 'createdAt',
                                                          sortOrder = 'DESC',
                                                        }) => {
  const context = `${CONTEXT}/fetchPaginatedOutboundFulfillmentService`;
  
  try {
    const rawResult = await getPaginatedOutboundShipmentRecords({ filters, page, limit, sortBy, sortOrder });
    return transformPaginatedOutboundShipmentResults(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch outbound shipments.', {
      context,
      meta: { error: error.message }
    });
  }
};

/**
 * Fetches full shipment detail including fulfillments and batches.
 *
 * @param {string} shipmentId
 * @returns {Promise<Object>}
 *
 * @throws {AppError} `notFoundError` – no shipment found for the given ID.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchShipmentDetailsService = async (shipmentId) => {
  const context = `${CONTEXT}/fetchShipmentDetailsService`;
  
  try {
    const rawRows = await getShipmentDetailsById(shipmentId);
    
    if (!rawRows || rawRows.length === 0) {
      throw AppError.notFoundError(`Shipment not found for ID: ${shipmentId}`);
    }
    
    return transformShipmentDetailsRows(rawRows);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch shipment details.', {
      context,
      meta: { error: error.message }
    });
  }
};

/**
 * Completes a manual or pickup fulfillment by updating all linked statuses.
 *
 * Validates shipment, fulfillments, order state, and delivery method eligibility
 * before applying atomic status updates.
 *
 * @param {Object} completionData
 * @param {string} shipmentId
 * @param {Object} user
 * @returns {Promise<Object>}
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const completeManualFulfillmentService = async (completionData, shipmentId, user) => {
  const context = `${CONTEXT}/completeManualFulfillmentService`;
  
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      const {
        orderStatus,
        shipmentStatus,
        fulfillmentStatus,
      } = completionData;
      
      // 1. Fetch and validate shipment record.
      const shipment = await getShipmentByShipmentId(shipmentId, client);
      assertShipmentFound(shipment, shipmentId);
      
      const { order_id, status_code, delivery_method_name, is_pickup_location } = shipment;
      assertDeliveryMethodIsAllowed(delivery_method_name, is_pickup_location);
      
      const orderId = order_id;
      
      // 2. Fetch and validate fulfillments linked to this order.
      const fulfillments = await getOrderFulfillments({ orderId }, client);
      
      if (!fulfillments?.length) {
        throw AppError.validationError(`No fulfillments found for order ID ${orderId}.`);
      }
      
      const orderIds = [...new Set(fulfillments.map((f) => f.order_id))];
      
      if (orderIds.length !== 1 || orderIds[0] !== order_id) {
        throw AppError.validationError(
          'Mismatched order_id between shipment and fulfillments.'
        );
      }
      
      // 3. Fetch current fulfillment status metadata.
      const fulfillmentStatusIds  = fulfillments.map((f) => f.status_id);
      const fulfillmentStatusMeta = await getFulfillmentStatusesByIds(fulfillmentStatusIds, client);
      
      // 4. Fetch order metadata.
      const orderMeta = await getOrderTypeMetaByOrderId(orderId, client);
      assertOrderMeta(orderMeta);
      const { order_number: orderNumber } = orderMeta;
      
      // 5. Fetch order status and item metadata.
      const { order_status_code } = await fetchOrderMetadata(orderId, client);
      const orderItemMetadata     = await getOrderItemsByOrderId(orderId, client);
      const orderItemIds          = Array.isArray(orderItemMetadata)
        ? orderItemMetadata.map((oi) => oi.order_item_id).filter(Boolean)
        : [];
      
      // 6. Fetch allocation status metadata.
      const allocationStatusMetadata = await getAllocationStatuses(orderId, orderItemIds, client);
      
      // 7. Validate status readiness for manual fulfillment completion.
      validateStatusesBeforeManualFulfillment({
        orderStatusCode:    order_status_code,
        orderItemStatusCode: orderItemMetadata.map((oi) => oi.order_item_code),
        allocationStatuses: allocationStatusMetadata.map((ia) => ia.allocation_status_code),
        shipmentStatusCode: status_code,
        fulfillmentStatuses: fulfillmentStatusMeta.map((s) => s.code),
      });
      
      // 8. Resolve target status IDs.
      const { id: newOrderStatusId }       = await getOrderStatusByCode(orderStatus, client);
      const { id: newShipmentStatusId }    = await getShipmentStatusByCode(shipmentStatus, client);
      const { id: newFulfillmentStatusId } = await getFulfillmentStatusByCode(fulfillmentStatus, client);
      
      assertStatusesResolved({
        orderStatusId:       newOrderStatusId,
        shipmentStatusId:    newShipmentStatusId,
        fulfillmentStatusId: newFulfillmentStatusId,
      });
      
      // 9. Apply atomic status updates across all linked entities.
      const {
        orderStatusRow,
        orderItemStatusRow,
        orderFulfillmentStatusRow,
        shipmentStatusRow,
      } = await updateAllStatuses({
        orderId,
        orderNumber,
        allocationMeta:        null,
        newOrderStatusId,
        newAllocationStatusId: null,
        fulfillments,
        newFulfillmentStatusId,
        newShipmentStatusId,
        userId,
        client,
      });
      
      return transformPickupCompletionResult({
        orderStatusRow,
        orderItemStatusRow,
        orderFulfillmentStatusRow,
        shipmentStatusRow,
      });
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to complete manual fulfillment.', {
      context,
      meta: { error: error.message }
    });
  }
};

module.exports = {
  fulfillOutboundShipmentService,
  confirmOutboundFulfillmentService,
  fetchPaginatedOutboundFulfillmentService,
  fetchShipmentDetailsService,
  completeManualFulfillmentService,
};

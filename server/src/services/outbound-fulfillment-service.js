const { withTransaction } = require('../database/db');
const AppError = require('../utils/AppError');
const { getOrderTypeMetaByOrderId } = require('../repositories/order-type-repository');
const { getSalesOrderShipmentMetadata } = require('../repositories/order-repository');
const { insertOrderFulfillmentsBulk, getOrderFulfillments } = require('../repositories/order-fulfillment-repository');
const { insertShipmentBatchesBulk } = require('../repositories/shipment-batch-repository');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const { getWarehouseInventoryQuantities, bulkUpdateWarehouseQuantities } = require('../repositories/warehouse-inventory-repository');
const { getOrderStatusByCode } = require('../repositories/order-status-repository');
const { insertInventoryActivityLogs } = require('../repositories/inventory-log-repository');
const { getInventoryActionTypeId } = require('../repositories/inventory-action-type-repository');
const { transformFulfillmentResult, transformAdjustedFulfillmentResult, transformPaginatedOutboundShipmentResults } = require('../transformers/outbound-fulfillment-transformer');
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
  buildInventoryActivityLogs, assertOrderMeta, assertFulfillmentsValid,
  assertStatusesResolved, assertLogsGenerated, assertInventoryCoverage, assertEnrichedAllocations,
  assertInventoryAdjustments, assertActionTypeIdResolved, assertWarehouseUpdatesApplied,
} = require('../business/outbound-fulfillment-business');
const { getAllocationStatuses } = require('../repositories/inventory-allocations-repository');
const { validateAllocationStatusTransition } = require('../business/inventory-allocation-business');
const { getShipmentStatusByCode } = require('../repositories/shipment-status-repository');
const { getFulfillmentStatusByCode } = require('../repositories/fulfillment-status-repository');
const { getInventoryAllocationStatusId } = require('../repositories/inventory-allocation-status-repository');
const { error } = require('winston');
const { getPaginatedOutboundShipmentRecords } = require('../repositories/outbound-shipment-repository');

/**
 * Service: fulfillOutboundShipmentService
 *
 * Orchestrates the initial fulfillment of an outbound shipment for a given order.
 * This service is responsible for validating allocations, creating outbound
 * shipment records, inserting fulfillment and shipment batch links, and updating
 * order/allocation statuses — all within a single transaction.
 *
 * Note:
 * - This service does **not** adjust inventory quantities or insert inventory logs.
 *   Those responsibilities are deferred to `adjustInventoryForFulfillmentService`.
 *
 * Validation & Business Rules:
 *  - Fulfillment is allowed **only** if all order items are fully allocated.
 *  - Each allocation must be in a valid status for transition to `ALLOC_FULFILLING`.
 *  - Fulfillment cannot proceed from a finalized allocation or fulfillment status.
 *  - Allocations spanning multiple warehouses are **not allowed** in a single fulfillment.
 *  - Shipment, fulfillment, and batch records must be linked for full traceability.
 *
 * Workflow:
 *  1. Validate:
 *     - The order is fully allocated (no partially or unallocated items).
 *     - Each allocation’s current status allows transition to `ALLOC_FULFILLING`.
 *  2. Fetch allocation metadata and apply row-level locking (`FOR UPDATE`).
 *  3. Assert allocations belong to a single warehouse.
 *  4. Conditionally fetch delivery metadata depending on order type.
 *  5. Insert a new outbound shipment record.
 *  6. Insert fulfillment records grouped by `order_item_id + shipment_id`.
 *  7. Insert shipment batch records linking allocation batches to the shipment.
 *  8. Update allocation, order item, and order statuses.
 *  9. Return the structured fulfillment result.
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
 *  - shipmentRow: Inserted outbound shipment record
 *  - fulfillmentRow: Inserted fulfillment record(s)
 *  - shipmentBatchRow: Inserted shipment batch record(s)
 *  - orderStatusRow: Updated order status
 *  - orderItemStatusRow: Updated order item statuses
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
      
      const nextAllocationStepCode = 'ALLOC_FULFILLING';
      
      // 1. Validate that the order is fully allocated (no partial/missing allocations)
      await validateOrderIsFullyAllocated(rawOrderId, client);
      
      // 2. Fetch and lock allocations for the given order and allocation IDs
      const { allocationMeta } = await getAndLockAllocations(rawOrderId, allocations.ids, client);
      
      // 3. Ensure all allocations belong to the same warehouse
      const warehouseId = assertSingleWarehouseAllocations(allocationMeta);
      
      // 4. Validate allocation statuses — must be allowed to transition to ALLOC_FULFILLING
      const orderItemIds = allocationMeta.map(item => item.order_item_id);
      const allocationStatuses = await getAllocationStatuses(rawOrderId, orderItemIds,  client);
      allocationStatuses.forEach(({ allocation_status_code: code }) => {
        validateAllocationStatusTransition(code, nextAllocationStepCode);
      });
      
      const orderId = allocationStatuses[0]?.order_id;
      
      // 5. Fetch order metadata including type category and number
      const { order_id, order_type_category } = await getOrderTypeMetaByOrderId(orderId, client);
      
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
      
      const fulfillmentRowWithStatus = {
        ...fulfillmentRow,
        status_id: fulfillmentInputs[0].status_id,
      };
      
      // TODO: lockRows allocations
      
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
      
      // 10. Update high-level order + allocation statuses
      const {
        id: newStatusId,
      } = await getOrderStatusByCode('ORDER_PROCESSING', client);
      const newAllocationStatusId = await getInventoryAllocationStatusId(nextAllocationStepCode, client);
      
      const { orderStatusRow, orderItemStatusRow } =
        await updateAllStatuses({
          orderId: order_id,
          allocationMeta,
          newOrderStatusId: newStatusId,
          newAllocationStatusId,
          fulfillments: [],
          newFulfillmentStatusId: null,
          newShipmentStatusId: null,
          userId,
          client,
        });
      
      // 11. Log success
      logSystemInfo('Outbound shipment created and linked to allocations', {
        context: 'outbound-fulfillment-service/fulfillOutboundShipmentService',
        orderId,
        shipmentId: shipmentRow.id,
        userId,
      });

      // 12. Transform + return
      return transformFulfillmentResult({
        orderId,
        shipmentRow,
        fulfillmentRowWithStatus,
        shipmentBatchRow,
        orderStatusRow,
        orderItemStatusRow,
      });
    });
  } catch (error) {
    logSystemException(error, 'Error creating outbound shipment', {
      context: 'outbound-fulfillment-service/fulfillOutboundShipmentService',
      orderId: requestData?.orderId,
      userId: user?.id,
    });
    throw AppError.serviceError('Unable to create outbound shipment.', {
      cause: error,
      context: 'outbound-fulfillment-service/fulfillOutboundShipmentService',
    });
  }
};

/**
 * Service: adjustInventoryForFulfillmentService
 *
 * Handles the inventory adjustment phase of outbound fulfillment.
 * This service executes after an outbound shipment and related fulfillments
 * have been created (via `fulfillOutboundShipmentService`).
 *
 * Responsibilities:
 *  - Apply row-level locks on allocations and related inventory.
 *  - Compute and apply inventory quantity adjustments based on fulfilled quantities.
 *  - Update statuses across order, order items, allocations, fulfillments, and shipments.
 *  - Insert inventory activity logs for auditability.
 *
 * Validation & Business Rules:
 *  - A fulfillment record must already exist for the order; otherwise, adjustment cannot proceed.
 *  - Inventory is adjusted only for allocations linked to the order’s fulfillments.
 *  - Status transitions must respect business rules (no updates from finalized states).
 *  - Activity logs must capture fulfillment → allocation → shipment relationships.
 *
 * Workflow:
 *  1. Validate the order exists and fetch metadata (order number, type).
 *  2. Fetch and lock allocations for the order (`FOR UPDATE`).
 *  3. Fetch existing fulfillments; fail if none found.
 *  4. Fetch current inventory snapshot for affected batches.
 *  5. Enrich allocations with inventory data and compute adjustment deltas.
 *  6. Perform bulk inventory updates (quantity and reserved quantity).
 *  7. Resolve new status IDs (order, fulfillment, shipment).
 *  8. Update statuses across order, items, allocations, fulfillments, and shipments.
 *  9. Insert inventory activity logs for audit tracking.
 * 10. Return the full structured result (updated statuses, inventory IDs, logs).
 *
 * @param {Object} requestData - Adjustment request payload
 * @param {string} requestData.orderId - ID of the order to adjust fulfillment for
 * @param {string} requestData.orderStatus - Target order status code
 * @param {string} requestData.shipmentStatus - Target shipment status code
 * @param {string} requestData.fulfillmentStatus - Target fulfillment status code
 *
 * @param {Object} user - Authenticated user object
 * @param {string} user.id - ID of the user initiating the adjustment
 *
 * @returns {Promise<Object>} Adjustment result object:
 *  - orderId: ID of the adjusted order
 *  - orderNumber: Order number
 *  - fulfillments: Fulfillment rows involved in adjustment
 *  - shipmentId: Shipment ID linked to fulfillments
 *  - warehouseInventoryIds: Updated warehouse inventory record IDs
 *  - orderStatusRow: Updated order status
 *  - orderItemStatusRow: Updated order item statuses
 *  - inventoryAllocationStatusRow: Updated allocation statuses
 *  - orderFulfillmentStatusRow: Updated fulfillment statuses
 *  - shipmentStatusRow: Updated shipment statuses
 *  - logMetadata: Inserted inventory activity logs
 *
 * @throws {AppError}
 *  - NotFoundError: If no fulfillments exist for the order
 *  - ValidationError: If status transitions are invalid
 *  - ServiceError: If inventory adjustment or status updates fail
 */
const adjustInventoryForFulfillmentService = async (requestData, user) => {
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      const { orderId: rawOrderId, orderStatus, allocationStatus, shipmentStatus, fulfillmentStatus } = requestData;
      // TODO: validate process: status?
      
      // --- 1. Fetch order metadata (ensures order exists & provides order number)
      const orderMeta =
        await getOrderTypeMetaByOrderId(rawOrderId, client);
      assertOrderMeta(orderMeta);
      const { order_id: orderId, order_number: orderNumber } = orderMeta;
      
      // --- 2. Fetch and lock allocations for this order
      const { allocationMeta, warehouseBatchKeys } = await getAndLockAllocations(
        orderId,
        null,
        client
      );
      
      // --- 3. Fetch existing fulfillments for the order
      const fulfillments = await getOrderFulfillments({ orderId }, client);
      assertFulfillmentsValid(fulfillments, orderNumber);
      
      // --- 4. Fetch current inventory snapshot for affected batches
      const inventoryMeta = await getWarehouseInventoryQuantities(
        warehouseBatchKeys,
        client
      );
      assertInventoryCoverage(inventoryMeta);
      
      // --- 5. Enrich allocations with current inventory (for delta calculation)
      const enrichedAllocations = enrichAllocationsWithInventory(
        allocationMeta,
        inventoryMeta
      );
      assertEnrichedAllocations(enrichedAllocations);
      
      // --- 6. Compute inventory deltas based on fulfillment quantities
      const updatesObject = calculateInventoryAdjustments(enrichedAllocations);
      assertInventoryAdjustments(updatesObject);
      
      // TODO: lockRows warehouse_inventory, inventory_allocations
      
      // --- 7. Apply inventory adjustments (update qty + reserved qty)
      const warehouseInventoryIds = await bulkUpdateWarehouseQuantities(updatesObject, userId, client);
      assertWarehouseUpdatesApplied(warehouseInventoryIds, { updates: updatesObject });
      
      // --- 8. Resolve new status IDs for order, shipment, and fulfillment
      const { id: newOrderStatusId } = await getOrderStatusByCode(
        orderStatus,
        client
      );
      const newAllocationStatusId = await getInventoryAllocationStatusId(
        allocationStatus,
        client
      );
      const { id: newShipmentStatusId } = await getShipmentStatusByCode(
        shipmentStatus,
        client
      );
      const { id: newFulfillmentStatusId } = await getFulfillmentStatusByCode(
        fulfillmentStatus,
        client
      );
      assertStatusesResolved({
        orderStatusId: newOrderStatusId,
        shipmentStatusId: newShipmentStatusId,
        fulfillmentStatusId: newFulfillmentStatusId,
      });
      
      // --- 9. Update statuses across order, items, allocations, fulfillments, shipments
      const {
        orderStatusRow,
        orderItemStatusRow,
        inventoryAllocationStatusRow,
        orderFulfillmentStatusRow,
        shipmentStatusRow,
      } = await updateAllStatuses(
        {
          orderId,
          orderNumber,
          allocationMeta,
          newOrderStatusId,
          newAllocationStatusId,
          fulfillments,
          newFulfillmentStatusId,
          newShipmentStatusId,
          userId,
          client
        }
      );
      
      // --- 10. Insert inventory activity logs for traceability
      const inventoryActionTypeId = await getInventoryActionTypeId(
        'fulfilled',
        client
      );
      assertActionTypeIdResolved(inventoryActionTypeId, 'fulfilled');
      const logs = fulfillments.flatMap(f => {
        // find the one allocation this fulfillment is tied to
        const allocation = enrichedAllocations.find(
          a => a.allocation_id === f.allocation_id
        );
        
        if (!allocation) return []; // skip if allocation not found (safety net)
        
        return buildInventoryActivityLogs([allocation], updatesObject, {
          inventoryActionTypeId,
          userId,
          orderId,
          shipmentId: f.shipment_id,        // same across all fulfillments
          fulfillmentId: f.fulfillment_id,  // unique per fulfillment
          orderNumber,
        });
      });
      assertLogsGenerated(logs, 'build');
      const logMetadata = await insertInventoryActivityLogs(logs, client);
      assertLogsGenerated(logMetadata, 'insert');
      
      // --- 11. Log success
      logSystemInfo('Inventory successfully adjusted for fulfillment', {
        context:
          'outbound-fulfillment-service/adjustInventoryForFulfillmentService',
        orderId,
        userId,
      });
      
      // --- 12. Transform + return structured result
      return transformAdjustedFulfillmentResult({
        orderId,
        orderNumber,
        fulfillments,
        shipmentId: fulfillments[0].shipment_id,
        warehouseInventoryIds,
        orderStatusRow,
        orderItemStatusRow,
        inventoryAllocationStatusRow,
        orderFulfillmentStatusRow,
        shipmentStatusRow,
        logMetadata,
      });
    });
  } catch (error) {
    logSystemException(error, 'Error adjusting inventory for fulfillment', {
      context: 'outbound-fulfillment-service/adjustInventoryForFulfillmentService',
      orderId: requestData?.orderId,
      userId: user?.id,
    });
    
    throw AppError.serviceError(
      'Unable to adjust inventory for fulfillment.',
      {
        cause: error,
        context:
          'outbound-fulfillment-service/adjustInventoryForFulfillmentService',
      }
    );
  }
};

/**
 * Service: Fetch Paginated Outbound Fulfillments
 *
 * Provides a service-level abstraction over repository queries for outbound shipments.
 * Handles pagination, filtering, transformation, and structured logging.
 *
 * ### Flow
 * 1. Delegates to `getPaginatedOutboundShipmentRecords` in the repository layer
 *    with provided filters, pagination, and sorting options.
 * 2. If no results are found:
 *    - Logs an informational event (`No outbound shipment records found`)
 *    - Returns an empty `data` array with zeroed pagination metadata
 * 3. If results are found:
 *    - Transforms raw SQL rows into clean API-ready objects via
 *      `transformPaginatedOutboundShipmentResults`
 *    - Logs a successful fetch event with context and metadata
 * 4. On error:
 *    - Logs the exception with contextual metadata
 *    - Throws a service-level `AppError` with a user-friendly message
 *
 * ### Parameters
 * @param {Object} options - Query options
 * @param {Object} [options.filters={}] - Filtering criteria (delegated to buildOutboundShipmentFilter)
 * @param {number} [options.page=1] - Current page number (1-based)
 * @param {number} [options.limit=10] - Max rows per page
 * @param {string} [options.sortBy='created_at'] - Sort column (validated against outboundShipmentSortMap)
 * @param {string} [options.sortOrder='DESC'] - Sort direction (`ASC` or `DESC`)
 *
 * ### Returns
 * @returns {Promise<{
 *   data: any[];
 *   pagination: {
 *     page: number;
 *     limit: number;
 *     totalRecords: number;
 *     totalPages: number;
 *   };
 * }>} Paginated outbound fulfillment results
 *
 * ### Errors
 * @throws {AppError} - Wrapped service error if repository execution fails
 *
 * ### Example
 * ```ts
 * const { data, pagination } = await fetchPaginatedOutboundFulfillmentService({
 *   filters: { warehouseIds: ['uuid-warehouse'] },
 *   page: 1,
 *   limit: 20,
 *   sortBy: 'created_at',
 *   sortOrder: 'DESC',
 * });
 * ```
 */
const fetchPaginatedOutboundFulfillmentService = async ({
                                                           filters = {},
                                                           page = 1,
                                                           limit = 10,
                                                           sortBy = 'created_at',
                                                           sortOrder = 'DESC',
                                                         }) => {
  try {
    // Step 1: Query raw paginated outbound shipment rows from repository
    const rawResult = await getPaginatedOutboundShipmentRecords({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    // Step 2: Handle no results
    if (!rawResult || rawResult.data.length === 0) {
      logSystemInfo('No outbound shipment records found', {
        context: 'outbound-fulfillment-service/fetchPaginatedOutboundFulfillmentService',
        filters,
        pagination: { page, limit },
        sort: { sortBy, sortOrder },
      });
      
      return {
        data: [],
        pagination: {
          page,
          limit,
          totalRecords: 0,
          totalPages: 0,
        },
      };
    }
    
    // Step 3: Transform raw SQL rows into clean API-ready objects
    const result = transformPaginatedOutboundShipmentResults(rawResult);
    
    // Step 4: Log success
    logSystemInfo('Fetched paginated outbound shipment records', {
      context: 'outbound-fulfillment-service/fetchPaginatedOutboundFulfillmentService',
      filters,
      pagination: result.pagination,
      sort: { sortBy, sortOrder },
    });
    
    return result;
  } catch (error) {
    // Step 5: Log exception and rethrow as service-level error
    logSystemException(error, 'Failed to fetch paginated outbound shipment records', {
      context: 'outbound-fulfillment-service/fetchPaginatedOutboundFulfillmentService',
      filters,
      pagination: { page, limit },
      sort: { sortBy, sortOrder },
    });
    
    throw AppError.serviceError('Could not fetch outbound shipments. Please try again later.');
  }
};

module.exports = {
  fulfillOutboundShipmentService,
  adjustInventoryForFulfillmentService,
  fetchPaginatedOutboundFulfillmentService,
};

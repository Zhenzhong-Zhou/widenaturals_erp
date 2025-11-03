const { withTransaction } = require('../database/db');
const AppError = require('../utils/AppError');
const {
  getOrderTypeMetaByOrderId,
} = require('../repositories/order-type-repository');
const {
  getSalesOrderShipmentMetadata,
  fetchOrderMetadata,
} = require('../repositories/order-repository');
const {
  insertOrderFulfillmentsBulk,
  getOrderFulfillments,
} = require('../repositories/order-fulfillment-repository');
const {
  insertShipmentBatchesBulk,
} = require('../repositories/shipment-batch-repository');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const {
  getWarehouseInventoryQuantities,
  bulkUpdateWarehouseQuantities,
} = require('../repositories/warehouse-inventory-repository');
const {
  getOrderStatusByCode,
} = require('../repositories/order-status-repository');
const {
  insertInventoryActivityLogs,
} = require('../repositories/inventory-log-repository');
const {
  getInventoryActionTypeId,
} = require('../repositories/inventory-action-type-repository');
const {
  transformFulfillmentResult,
  transformAdjustedFulfillmentResult,
  transformPaginatedOutboundShipmentResults,
  transformShipmentDetailsRows,
  transformPickupCompletionResult,
} = require('../transformers/outbound-fulfillment-transformer');
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
} = require('../business/outbound-fulfillment-business');
const {
  getAllocationStatuses,
} = require('../repositories/inventory-allocations-repository');
const {
  validateAllocationStatusTransition,
} = require('../business/inventory-allocation-business');
const {
  getShipmentStatusByCode,
} = require('../repositories/shipment-status-repository');
const {
  getFulfillmentStatusByCode,
  getFulfillmentStatusesByIds,
} = require('../repositories/fulfillment-status-repository');
const {
  getInventoryAllocationStatusId,
} = require('../repositories/inventory-allocation-status-repository');
const {
  getPaginatedOutboundShipmentRecords,
  getShipmentDetailsById,
  getShipmentByShipmentId,
} = require('../repositories/outbound-shipment-repository');
const {
  getOrderItemsByOrderId,
} = require('../repositories/order-item-repository');

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
        shipmentBatchNote,
      } = requestData;

      const nextAllocationStepCode = 'ALLOC_FULFILLING';

      // 1. Validate that the order is fully allocated (no partial/missing allocations)
      await validateOrderIsFullyAllocated(rawOrderId, client);

      // 2. Fetch and lock allocations for the given order and allocation IDs
      const { allocationMeta } = await getAndLockAllocations(
        rawOrderId,
        allocations.ids,
        client
      );

      // 3. Ensure all allocations belong to the same warehouse
      const warehouseId = assertSingleWarehouseAllocations(allocationMeta);

      // 4. Validate allocation statuses — must be allowed to transition to ALLOC_FULFILLING
      const orderItemIds = allocationMeta.map((item) => item.order_item_id);
      const allocationStatuses = await getAllocationStatuses(
        rawOrderId,
        orderItemIds,
        client
      );
      allocationStatuses.forEach(({ allocation_status_code: code }) => {
        validateAllocationStatusTransition(code, nextAllocationStepCode);
      });

      const orderId = allocationStatuses[0]?.order_id;

      // 5. Fetch order metadata including type category and number
      const { order_id, order_type_category } = await getOrderTypeMetaByOrderId(
        orderId,
        client
      );

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
      const fulfillmentRows = await insertOrderFulfillmentsBulk(
        fulfillmentInputs,
        client
      );

      if (!Array.isArray(fulfillmentRows) || !fulfillmentRows.length) {
        throw new Error(
          'No fulfillment rows returned from insertOrderFulfillmentsBulk()'
        );
      }

      const fulfillmentRowsWithStatus = fulfillmentRows.map((row, idx) => ({
        ...row,
        status_id: fulfillmentInputs[idx].status_id,
      }));

      // TODO: lockRows allocations

      // 9. Insert shipment batch linking the allocation and shipment
      // For each allocationMeta + its fulfillmentRow
      const shipmentBatchInputs = allocationMeta.flatMap((meta) => {
        // Find fulfillment that matches this allocation’s order_item_id (or other grouping key)
        const fulfillment = fulfillmentRows.find(
          (f) => f.order_item_id === meta.order_item_id
        );

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
      const [shipmentBatchRow] = await insertShipmentBatchesBulk(
        shipmentBatchInputs,
        client
      );

      // 10. Update high-level order + allocation statuses
      const { id: newStatusId } = await getOrderStatusByCode(
        'ORDER_PROCESSING',
        client
      );
      const newAllocationStatusId = await getInventoryAllocationStatusId(
        nextAllocationStepCode,
        client
      );

      const { orderStatusRow, orderItemStatusRow } = await updateAllStatuses({
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
        fulfillmentRowsWithStatus,
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
 * Service: confirmOutboundFulfillmentService
 *
 * Handles the **confirmation phase** of outbound fulfillment.
 * This is the stage where inventory is finalized and status transitions
 * are applied to reflect that the outbound shipment is now confirmed.
 *
 * This service runs after the outbound shipment and fulfillments have been
 * initially created via `fulfillOutboundShipmentService`.
 *
 * ---
 * Responsibilities:
 *  - Validate workflow eligibility via current order, shipment, and fulfillment statuses.
 *  - Lock related allocations and inventory rows for safe concurrent processing.
 *  - Compute and apply inventory quantity adjustments (fulfilled quantities → deducted).
 *  - Update statuses across orders, order items, allocations, fulfillments, and shipments.
 *  - Insert inventory activity logs for traceability and audit.
 *
 * ---
 * Validation & Business Rules:
 *  - Fulfillment records must exist for the given order; otherwise, confirmation cannot proceed.
 *  - Status validation ensures only confirmable states are processed
 *    (e.g., not confirming already fulfilled or cancelled shipments).
 *  - A single shipment ID must be associated with all fulfillments being confirmed.
 *  - Confirming outbound fulfillment always updates inventory and audit logs atomically.
 *
 * ---
 * Workflow:
 *  1. Fetch and validate the order metadata (existence, order type, and current status).
 *  2. Lock all allocations for this order (`FOR UPDATE`) to prevent race conditions.
 *  3. Fetch all fulfillments and ensure they reference a single outbound shipment.
 *  4. Fetch the outbound shipment record by its canonical ID.
 *  5. Fetch fulfillment status codes for validation.
 *  6. Validate workflow eligibility before confirmation (order, shipment, fulfillment statuses).
 *  7. Fetch and verify inventory snapshot for all affected batches.
 *  8. Enrich allocations with inventory data and compute quantity deltas.
 *  9. Apply inventory updates in bulk.
 * 10. Resolve target status IDs (order, allocation, shipment, fulfillment).
 * 11. Update all statuses in a single transaction.
 * 12. Insert inventory activity logs for traceability.
 * 13. Return a structured summary of all updated records.
 *
 * ---
 * @param {Object} requestData - Confirmation request payload
 * @param {string} requestData.orderId - ID of the order to confirm
 * @param {string} requestData.orderStatus - Target order status code
 * @param {string} requestData.allocationStatus - Target allocation status code
 * @param {string} requestData.shipmentStatus - Target shipment status code
 * @param {string} requestData.fulfillmentStatus - Target fulfillment status code
 * @param {Object} user - Authenticated user context
 * @param {string} user.id - ID of the user performing the confirmation
 *
 * @returns {Promise<Object>} Confirmation result object
 *  - orderId
 *  - orderNumber
 *  - fulfillments
 *  - shipmentId
 *  - warehouseInventoryIds
 *  - orderStatusRow
 *  - orderItemStatusRow
 *  - inventoryAllocationStatusRow
 *  - orderFulfillmentStatusRow
 *  - shipmentStatusRow
 *  - logMetadata
 *
 * @throws {AppError}
 *  - NotFoundError: if no fulfillments exist for the order
 *  - ValidationError: if statuses are not eligible for confirmation
 *  - ServiceError: if inventory update or transaction fails
 */
const confirmOutboundFulfillmentService = async (requestData, user) => {
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      const {
        orderId: rawOrderId,
        orderStatus,
        allocationStatus,
        shipmentStatus,
        fulfillmentStatus,
      } = requestData;

      // --- 1. Validate and fetch order metadata
      const orderMeta = await getOrderTypeMetaByOrderId(rawOrderId, client);
      assertOrderMeta(orderMeta);
      const { order_id: orderId, order_number: orderNumber } = orderMeta;

      // Fetch current order status (for workflow validation)
      const { order_status_code } = await fetchOrderMetadata(orderId, client);

      // --- 2. Fetch and lock allocations for this order
      const { allocationMeta, warehouseBatchKeys } =
        await getAndLockAllocations(orderId, null, client);

      // --- 3. Fetch existing fulfillments for the order
      const fulfillments = await getOrderFulfillments({ orderId }, client);
      assertFulfillmentsValid(fulfillments, orderNumber);

      // --- 4. Resolve unique shipment ID from fulfillments
      const uniqueShipmentIds = [
        ...new Set(fulfillments.map((f) => f.shipment_id)),
      ];
      if (uniqueShipmentIds.length > 1) {
        throw AppError.validationError(
          'Multiple shipment IDs detected — cannot confirm multiple shipments in a single transaction.',
          { context: 'confirmOutboundFulfillmentService' }
        );
      }

      const shipmentId = uniqueShipmentIds[0];

      // Optional: check for mismatch between request and derived shipment
      if (requestData.shipmentId && requestData.shipmentId !== shipmentId) {
        logSystemInfo('Shipment ID mismatch detected', {
          context: 'confirmOutboundFulfillmentService',
          requestShipmentId: requestData.shipmentId,
          actualShipmentId: shipmentId,
        });
      }

      // --- 5. Fetch shipment record and assert existence
      const shipment = await getShipmentByShipmentId(shipmentId, client);
      assertShipmentFound(shipment, shipmentId);

      // --- 6. Fetch fulfillment status metadata
      const fulfillmentStatusIds = fulfillments.map((f) => f.status_id);
      const fulfillmentStatusMeta = await getFulfillmentStatusesByIds(
        fulfillmentStatusIds,
        client
      );

      // --- 7. Validate workflow eligibility before confirmation
      validateStatusesBeforeConfirmation({
        orderStatusCode: order_status_code,
        fulfillmentStatuses: fulfillmentStatusMeta.map((s) => s.code),
        shipmentStatusCode: shipment.status_code,
      });

      // --- 8. Fetch inventory snapshot for affected batches
      const inventoryMeta = await getWarehouseInventoryQuantities(
        warehouseBatchKeys,
        client
      );
      assertInventoryCoverage(inventoryMeta);

      // --- 9. Enrich allocations with current inventory data
      const enrichedAllocations = enrichAllocationsWithInventory(
        allocationMeta,
        inventoryMeta
      );
      assertEnrichedAllocations(enrichedAllocations);

      // --- 10. Compute inventory adjustments (delta quantities)
      const updatesObject = calculateInventoryAdjustments(enrichedAllocations);
      assertInventoryAdjustments(updatesObject);

      // TODO: lockRows warehouse_inventory, inventory_allocations

      // --- 11. Apply bulk inventory updates (qty + reserved qty)
      const warehouseInventoryIds = await bulkUpdateWarehouseQuantities(
        updatesObject,
        userId,
        client
      );
      assertWarehouseUpdatesApplied(warehouseInventoryIds, {
        updates: updatesObject,
      });

      // --- 12. Resolve new status IDs for transition
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

      // --- 13. Update statuses across all linked entities
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

      // --- 14. Insert inventory activity logs
      const inventoryActionTypeId = await getInventoryActionTypeId(
        'fulfilled',
        client
      );
      assertActionTypeIdResolved(inventoryActionTypeId, 'fulfilled');

      const logs = fulfillments.flatMap((f) => {
        const allocation = enrichedAllocations.find(
          (a) => a.allocation_id === f.allocation_id
        );
        if (!allocation) return [];
        return buildInventoryActivityLogs([allocation], updatesObject, {
          inventoryActionTypeId,
          userId,
          orderId,
          shipmentId: f.shipment_id,
          fulfillmentId: f.fulfillment_id,
          orderNumber,
        });
      });

      assertLogsGenerated(logs, 'build');
      const logMetadata = await insertInventoryActivityLogs(logs, client);
      assertLogsGenerated(logMetadata, 'insert');

      // --- 15. Log success
      logSystemInfo('Outbound fulfillment successfully confirmed', {
        context:
          'outbound-fulfillment-service/confirmOutboundFulfillmentService',
        orderId,
        userId,
      });

      // --- 16. Return structured confirmation result
      return transformAdjustedFulfillmentResult({
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
      });
    });
  } catch (error) {
    logSystemException(error, 'Error confirming outbound fulfillment', {
      context: 'outbound-fulfillment-service/confirmOutboundFulfillmentService',
      orderId: requestData?.orderId,
      userId: user?.id,
    });

    throw AppError.serviceError('Unable to confirm outbound fulfillment.', {
      cause: error,
      context: 'outbound-fulfillment-service/confirmOutboundFulfillmentService',
    });
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
        context:
          'outbound-fulfillment-service/fetchPaginatedOutboundFulfillmentService',
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
      context:
        'outbound-fulfillment-service/fetchPaginatedOutboundFulfillmentService',
      filters,
      pagination: result.pagination,
      sort: { sortBy, sortOrder },
    });

    return result;
  } catch (error) {
    // Step 5: Log exception and rethrow as service-level error
    logSystemException(
      error,
      'Failed to fetch paginated outbound shipment records',
      {
        context:
          'outbound-fulfillment-service/fetchPaginatedOutboundFulfillmentService',
        filters,
        pagination: { page, limit },
        sort: { sortBy, sortOrder },
      }
    );

    throw AppError.serviceError(
      'Could not fetch outbound shipments. Please try again later.'
    );
  }
};

/**
 * Service: Fetch and transform detailed shipment information by shipment ID.
 *
 * Responsibilities:
 *  - Calls repository function (`getShipmentDetailsById`) to fetch raw denormalized rows.
 *  - Transforms rows into a nested structured object (`transformShipmentDetailsRows`).
 *  - Logs success/failure with structured metadata.
 *
 * @async
 * @function
 * @param {string} shipmentId - UUID of the outbound shipment
 * @returns {Promise<Object|null>} Nested shipment details or null if no data
 *
 * @throws {AppError} Throws `AppError.serviceError` if fetch/transform fails
 *
 * @example
 * const details = await fetchShipmentDetailsService("shp-001");
 * console.log(details.shipment.status.code); // "SHIP_CONFIRMED"
 */
const fetchShipmentDetailsService = async (shipmentId) => {
  try {
    const rawRows = await getShipmentDetailsById(shipmentId);

    if (!rawRows || rawRows.length === 0) {
      throw AppError.notFoundError(`Shipment not found for ID=${shipmentId}`);
    }

    const transformed = transformShipmentDetailsRows(rawRows);

    logSystemInfo('Fetched and transformed shipment details', {
      context: 'outbound-fulfillment-service/fetchShipmentDetailsService',
      shipmentId,
      rowCount: rawRows?.length ?? 0,
    });

    return transformed;
  } catch (error) {
    logSystemException(error, 'Failed to fetch shipment details', {
      context: 'outbound-fulfillment-service/fetchShipmentDetailsService',
      shipmentId,
    });

    throw AppError.serviceError('Failed to fetch shipment details', {
      shipmentId,
      cause: error,
    });
  }
};

/**
 * @function
 * @description
 * Completes a manual outbound fulfillment (e.g., in-store pickup or personal delivery).
 *
 * This service finalizes an outbound shipment and all related fulfillments for orders
 * that do not involve external carriers. It validates the current workflow state,
 * ensures all fulfillment and allocation conditions are met, resolves new status IDs,
 * and performs all status transitions within a single atomic transaction.
 *
 * ## When to Use
 * - Customer manually picks up the order in-store
 * - Internal staff delivers the package (e.g., personal driver)
 *
 * @businessFlow
 *  1. Fetch the shipment record by ID.
 *  2. Validate the delivery method (must be pickup-type or whitelisted).
 *  3. Fetch and validate all fulfillments linked to the same order.
 *  4. Fetch status metadata for fulfillments, order, and order items.
 *  5. Validate workflow eligibility via `validateStatusesBeforeManualFulfillment`.
 *  6. Resolve new status IDs from string codes.
 *  7. Atomically update all related statuses via `updateAllStatuses`.
 *  8. Return structured fulfillment completion result.
 *
 * @param {Object} requestData
 * @param {string} requestData.shipmentId - UUID of the outbound shipment
 * @param {string} requestData.orderStatus - Target order status code (e.g., 'ORDER_DELIVERED')
 * @param {string} requestData.shipmentStatus - Target shipment status code (e.g., 'SHIPMENT_COMPLETED')
 * @param {string} requestData.fulfillmentStatus - Target fulfillment status code (e.g., 'FULFILLMENT_COMPLETED')
 * @param {Object} user - Authenticated user
 * @param {string} user.id - Acting user ID
 *
 * @returns {Promise<Object>} Transformed fulfillment completion result:
 * {
 *   order: { id, statusId, statusDate },
 *   items: [{ id, statusId, statusDate }],
 *   fulfillments: [{ id }],
 *   shipment: [{ id }],
 *   meta: { updatedAt }
 * }
 *
 * @throws {AppError.validationError|AppError.serviceError} On validation or transactional failure
 */
const completeManualFulfillmentService = async (requestData, user) => {
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      const {
        shipmentId: rawShipmentId,
        orderStatus,
        shipmentStatus,
        fulfillmentStatus,
      } = requestData;

      // --- Step 1: Fetch and validate shipment record
      // Ensures the provided shipment exists and retrieves its associated order ID
      const shipment = await getShipmentByShipmentId(rawShipmentId, client);
      assertShipmentFound(shipment, rawShipmentId);

      const { order_id, status_code, delivery_method_name } = shipment;
      assertDeliveryMethodIsAllowed(delivery_method_name);

      const orderId = order_id;
      logSystemInfo('Step 1: Shipment record fetched', {
        context:
          'outbound-fulfillment-service/completeManualFulfillmentService',
        shipmentId: rawShipmentId,
        orderId,
        currentShipmentStatus: status_code,
      });

      // --- Step 2: Retrieve and validate all fulfillments linked to the order
      const fulfillments = await getOrderFulfillments({ orderId }, client);
      if (!fulfillments?.length) {
        throw AppError.validationError(
          `No fulfillments found for order ID ${orderId}.`,
          {
            context:
              'outbound-fulfillment-service/completeManualFulfillmentService',
          }
        );
      }

      // Validate fulfillments all reference the same order
      const orderIds = [...new Set(fulfillments.map((f) => f.order_id))];
      if (orderIds.length !== 1 || orderIds[0] !== order_id) {
        throw AppError.validationError(
          'Mismatched order_id between shipment and fulfillments',
          {
            context:
              'outbound-fulfillment-service/completeManualFulfillmentService',
          }
        );
      }

      // --- Step 3: Fetch current fulfillment status metadata
      const fulfillmentStatusIds = fulfillments.map((f) => f.status_id);
      const fulfillmentStatusMeta = await getFulfillmentStatusesByIds(
        fulfillmentStatusIds,
        client
      );

      // --- Step 4: Fetch order metadata and verify existence
      const orderMeta = await getOrderTypeMetaByOrderId(orderId, client);
      assertOrderMeta(orderMeta);
      const { order_number: orderNumber } = orderMeta;

      // --- Step 5: Fetch order and order item metadata
      const { order_status_code } = await fetchOrderMetadata(orderId, client);
      const orderItemMetadata = await getOrderItemsByOrderId(orderId, client);

      // Derive order item IDs safely
      const orderItemIds = Array.isArray(orderItemMetadata)
        ? orderItemMetadata.map((oi) => oi.order_item_id).filter(Boolean)
        : [];

      logSystemInfo('Step 5: Order, items, and fulfillment metadata fetched', {
        context:
          'outbound-fulfillment-service/completeManualFulfillmentService',
        orderId,
        orderNumber,
        currentOrderStatus: order_status_code,
        orderItemIds,
        fulfillmentStatuses: fulfillmentStatusMeta.map((s) => s.code),
        shipmentStatusCode: status_code,
      });

      // --- Step 6: Retrieve allocation status metadata for validation
      const allocationStatusMetadata = await getAllocationStatuses(
        orderId,
        orderItemIds,
        client
      );

      // --- Step 7: Validate status readiness for manual fulfillment completion
      validateStatusesBeforeManualFulfillment({
        orderStatusCode: order_status_code,
        orderItemStatusCode: orderItemMetadata.map((oi) => oi.order_item_code),
        allocationStatuses: allocationStatusMetadata.map(
          (ia) => ia.allocation_status_code
        ),
        shipmentStatusCode: status_code,
        fulfillmentStatuses: fulfillmentStatusMeta.map((s) => s.code),
      });

      // --- Step 8: Resolve target status IDs from codes
      const { id: newOrderStatusId } = await getOrderStatusByCode(
        orderStatus,
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

      // --- Step 9: Perform atomic status updates across entities
      const {
        orderStatusRow,
        orderItemStatusRow,
        orderFulfillmentStatusRow,
        shipmentStatusRow,
      } = await updateAllStatuses({
        orderId,
        orderNumber,
        allocationMeta: null,
        newOrderStatusId,
        newAllocationStatusId: null,
        fulfillments,
        newFulfillmentStatusId,
        newShipmentStatusId,
        userId,
        client,
      });

      // --- Step 10: Log success with contextual metadata
      logSystemInfo('Manual fulfillment successfully completed', {
        context:
          'outbound-fulfillment-service/completeManualFulfillmentService',
        orderId,
        shipmentId: rawShipmentId,
        newStatuses: {
          orderStatus,
          shipmentStatus,
          fulfillmentStatus,
        },
      });

      // --- Step 11: Return normalized transformer output
      return transformPickupCompletionResult({
        orderStatusRow,
        orderItemStatusRow,
        orderFulfillmentStatusRow,
        shipmentStatusRow,
      });
    });
  } catch (error) {
    // --- Global error logging for this service
    logSystemException(error, 'Failed to complete manual fulfillment', {
      context: 'outbound-fulfillment-service/completeManualFulfillmentService',
      requestData,
      userId: user?.id,
    });

    throw AppError.serviceError('Manual fulfillment transaction failed', {
      context: 'outbound-fulfillment-service/completeManualFulfillmentService',
      cause: error.message,
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

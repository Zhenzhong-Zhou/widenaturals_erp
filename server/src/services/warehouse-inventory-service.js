/**
 * @file warehouse-inventory-service.js
 * @description
 * Service layer for warehouse inventory operations.
 *
 * All read operations enforce warehouse scope via assertWarehouseAccess
 * and enforceWarehouseScope before querying. Write operations additionally
 * validate business rules and generate activity log entries within
 * transactions.
 *
 * Read services:
 *  - fetchPaginatedWarehouseInventoryService  — paginated list with ACL-driven filters
 *  - getWarehouseInventoryDetailService       — single record with zones and movements
 *  - getWarehouseSummaryService               — warehouse-level aggregate totals
 *  - getWarehouseItemSummaryService           — product/packaging item-level summaries
 *
 * Write services:
 *  - createWarehouseInventoryService          — inbound inventory creation with activity log
 *  - adjustWarehouseInventoryQuantityService  — bulk quantity adjustment with activity log
 *  - updateWarehouseInventoryStatusService    — bulk status update with activity log
 *  - updateWarehouseInventoryMetadataService  — single record metadata correction
 *  - recordWarehouseInventoryOutboundService  — bulk outbound recording with activity log
 *
 * Exports:
 *  - fetchPaginatedWarehouseInventoryService
 *  - getWarehouseInventoryDetailService
 *  - getWarehouseSummaryService
 *  - getWarehouseItemSummaryService
 *  - createWarehouseInventoryService
 *  - adjustWarehouseInventoryQuantityService
 *  - updateWarehouseInventoryStatusService
 *  - updateWarehouseInventoryMetadataService
 *  - recordWarehouseInventoryOutboundService
 */

'use strict';

const {
  getPaginatedWarehouseInventory,
  insertWarehouseInventoryBulk,
  fetchWarehouseInventoryStateByIds,
  updateWarehouseInventoryQuantityBulk,
  updateWarehouseInventoryOutboundBulk,
  updateWarehouseInventoryStatusBulk,
  updateWarehouseInventoryMetadata,
  getWarehouseInventoryDetailById,
  getWarehouseSummary,
  getWarehouseSummaryByStatus,
  getWarehouseProductSummary,
  getWarehousePackagingSummary
} = require('../repositories/warehouse-inventory-repository');
const AppError = require('../utils/AppError');
const {
  transformPaginatedWarehouseInventory,
  transformWarehouseInventoryDetailRecord,
  transformWarehouseSummary,
  transformWarehouseProductSummary,
  transformWarehousePackagingSummary
} = require('../transformers/warehouse-inventory-transformer');
const {
  evaluateWarehouseInventoryVisibility,
  applyWarehouseInventoryVisibilityRules,
  assertWarehouseAccess,
  enforceWarehouseScope,
  validateInboundQuantities,
  validateInboundBatches,
  resolveInboundStatus,
  buildInboundActivityLogEntries,
  validateQuantityAdjustments,
  buildQuantityAdjustmentLogEntries,
  validateOutboundRecords,
  buildOutboundLogEntries,
  buildStatusChangeLogEntries,
  assertAllInventoryRecordsFound,
  resolveInventoryStatus
} = require('../business/warehouse-inventory-business');
const { withTransaction } = require('../database/db');
const { insertInventoryActivityLogBulk } = require('../repositories/inventory-activity-log-repository');
const { getStatusId } = require('../config/status-cache');
const { validateInventoryStatusIds } = require('../repositories/inventory-status-repository');
const { getWarehouseZonesByInventoryId } = require('../repositories/warehouse-zone-repository');
const { getWarehouseMovementsByInventoryId } = require('../repositories/warehouse-movement-repository');
const { transformWarehouseZones } = require('../transformers/warehouse-zone-transformer');
const { transformWarehouseMovements } = require('../transformers/warehouse-movement-transformer');

const CONTEXT = 'warehouse-inventory-service';

/**
 * Fetches a paginated, ACL-filtered list of warehouse inventory records.
 *
 * Resolves the user's warehouse scope and batch-type visibility, applies
 * those rules to the incoming filters, queries the repository, and
 * transforms the result for UI consumption.
 *
 * @param {WarehouseInventoryFilters} filters
 * @param {number}   [page=1]
 * @param {number}   [limit=20]
 * @param {string}   [sortBy='inboundDate']
 * @param {string}   [sortOrder='DESC']
 * @param {AuthUser} user
 *
 * @returns {Promise<PaginatedResult<WarehouseInventoryRecord>>}
 * @throws {AppError} Passes through business/ACL AppErrors; wraps unexpected errors as serviceError.
 */
const fetchPaginatedWarehouseInventoryService = async ({
                                                         filters   = {},
                                                         page      = 1,
                                                         limit     = 20,
                                                         sortBy    = 'inboundDate',
                                                         sortOrder = 'DESC',
                                                         user,
                                                       }) => {
  const context = `${CONTEXT}/fetchPaginatedWarehouseInventoryService`;
  
  try {
    // 1. Resolve warehouse inventory visibility scope for this user.
    const access = await evaluateWarehouseInventoryVisibility(user);
    
    // 2. Apply warehouse scope + batch-type visibility rules to filters.
    const adjustedFilters = /** @type {WarehouseInventoryFilters} */ (
      applyWarehouseInventoryVisibilityRules(filters, access)
    );
    
    // 3. Short-circuit if user lacks access to the requested warehouse.
    if (adjustedFilters.forceEmptyResult) {
      return { data: [], pagination: { page, limit, totalRecords: 0, totalPages: 0 } };
    }
    
    // 4. Query raw warehouse inventory rows.
    const rawResult = await getPaginatedWarehouseInventory({
      filters: adjustedFilters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    // 5. Return empty shape immediately — no records to process.
    if (!rawResult?.data?.length) {
      return { data: [], pagination: { page, limit, totalRecords: 0, totalPages: 0 } };
    }
    
    // 6. Transform for UI consumption.
    return transformPaginatedWarehouseInventory(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError(
      'Unable to retrieve warehouse inventory records at this time.',
      {
        context,
        meta: { error: error.message }
      }
    );
  }
};

/**
 * Bulk creates inbound warehouse inventory records for a given warehouse.
 *
 * Validates warehouse access, batch existence, quantity rules, and resolves
 * the inbound status before inserting records and writing activity log entries.
 *
 * @param {string}   warehouseId
 * @param {object[]} records
 * @param {string}   records[].batchId
 * @param {number}   records[].warehouseQuantity
 * @param {number}   [records[].warehouseFee]
 * @param {string}   [records[].statusId]
 * @param {AuthUser} user
 * @returns {Promise<{ count: number, ids: string[] }>}
 * @throws {AppError} Passes through business/ACL AppErrors; wraps unexpected errors as serviceError.
 */
const createWarehouseInventoryService = async ({
                                               warehouseId,
                                               records,
                                               user,
                                             }) => {
  const context = `${CONTEXT}/createWarehouseInventoryService`;
  
  try {
    // 1. Warehouse scope check
    const assignedWarehouseIds = await assertWarehouseAccess(user);
    enforceWarehouseScope(assignedWarehouseIds, warehouseId);
    
    return await withTransaction(async (client) => {
      // 2. Validate quantities
      validateInboundQuantities(records);
      
      // 3. Validate batch IDs exist and not duplicated at this warehouse
      const batchIds = records.map((r) => r.batchId);
      await validateInboundBatches(batchIds, warehouseId, client);
      
      // 4. Resolve inbound status
      const statusId = await resolveInboundStatus(
        client,
        records[0]?.statusId
      );
      
      // 5. Resolve inbound action type
      const actionTypeId = getStatusId('action_manual_stock_insert');
      
      if (!actionTypeId) {
        throw AppError.businessError(
          'Inbound action type not found. Contact an administrator.'
        );
      }
      
      // 6. Build and insert inventory records
      const inventoryRows = records.map((record) => ({
        warehouse_id:       warehouseId,
        batch_id:           record.batchId,
        warehouse_quantity: record.warehouseQuantity,
        reserved_quantity:  0,
        warehouse_fee:      record.warehouseFee ?? 0,
        inbound_date:       record.inboundDate ?? new Date().toISOString(),
        status_id:          statusId,
        created_by:         user.id,
      }));
      
      const insertedRecords = await insertWarehouseInventoryBulk(
        inventoryRows, client
      );
      
      // 7. Build and insert activity log entries
      const logEntries = buildInboundActivityLogEntries(
        insertedRecords, actionTypeId, user.id
      );
      
      await insertInventoryActivityLogBulk(logEntries, client);
      
      // 8. Lean response
      return {
        count: insertedRecords.length,
        ids:   insertedRecords.map((r) => r.id),
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError(
      'Unable to record inbound inventory at this time.',
      {
        context,
        meta: { error: error.message }
      }
    );
  }
};

// ── Adjust quantities ───────────────────────────────────────────────

/**
 * Adjusts warehouse and reserved quantities for a set of inventory records
 * within a single warehouse.
 *
 * Flow:
 *  1. Validates the requesting user has access to the specified warehouse.
 *  2. Validates quantity adjustment inputs.
 *  3. Fetches pre-mutation inventory state for activity log generation.
 *  4. Resolves new inventory status per row based on resulting warehouse quantity.
 *  5. Applies bulk quantity updates scoped to the warehouse (atomic ACL guard).
 *  6. Builds and inserts inventory activity log entries.
 *
 * @param {object}   options
 * @param {string}   options.warehouseId              - UUID of the warehouse to adjust inventory in.
 * @param {WarehouseInventoryQuantityUpdate[]} options.updates
 * @param {object}   options.user                     - Authenticated user (requires `id` and permissions).
 *
 * @returns {Promise<{ count: number, updatedIds: string[] }>}
 *
 * @throws {AppError} `validationError`  — warehouse access denied or invalid quantity inputs.
 * @throws {AppError} `notFoundError`    — one or more inventory records not found in the warehouse.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `serviceError`.
 */
const adjustWarehouseInventoryQuantityService = async ({
                                                         warehouseId,
                                                         updates,
                                                         user,
                                                       }) => {
  const context = `${CONTEXT}/adjustWarehouseInventoryQuantityService`;
  
  try {
    const assignedWarehouseIds = await assertWarehouseAccess(user);
    enforceWarehouseScope(assignedWarehouseIds, warehouseId);
    
    validateQuantityAdjustments(updates);
    
    return await withTransaction(async (client) => {
      const ids             = updates.map((u) => u.id);
      const previousRecords = await fetchWarehouseInventoryStateByIds(ids, warehouseId, client);
      
      assertAllInventoryRecordsFound(ids, previousRecords);
      
      const actionTypeId     = getStatusId('action_manual_stock_adjust');
      const adjustmentTypeId = getStatusId('adjustment_manual_stock_insert');
      const inStockStatusId  = getStatusId('inventory_in_stock');
      const outOfStockStatusId = getStatusId('inventory_out_of_stock');
      
      if (!actionTypeId) {
        throw AppError.businessError(
          'Adjustment action type not found. Contact an administrator.',
          { context }
        );
      }
      
      // Resolve new status per row based on resulting warehouse quantity.
      const updateInputs = updates.map((u) => ({
        id:               u.id,
        warehouseQuantity: u.warehouseQuantity,
        reservedQuantity:  u.reservedQuantity,
        statusId:          resolveInventoryStatus(u.warehouseQuantity, { inStockStatusId, outOfStockStatusId }),
        warehouseId,
      }));
      
      const updatedRecords = await updateWarehouseInventoryQuantityBulk(
        updateInputs,
        user.id,
        client
      );
      
      const logEntries = buildQuantityAdjustmentLogEntries(
        previousRecords,
        updatedRecords,
        actionTypeId,
        adjustmentTypeId,
        user.id
      );
      
      await insertInventoryActivityLogBulk(logEntries, client);
      
      return {
        count:      updatedRecords.length,
        updatedIds: updatedRecords.map((r) => r.id),
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError(
      'Unable to adjust warehouse inventory quantities at this time.',
      {
        context,
        meta: { error: error.message },
      }
    );
  }
};

// ── Update status ───────────────────────────────────────────────────

/**
 * Bulk updates inventory status for a set of warehouse inventory records.
 *
 * Validates warehouse access and status ID existence, fetches pre-mutation
 * state for log generation, applies updates, and writes activity log entries.
 *
 * @param {string}   warehouseId
 * @param {object[]} updates
 * @param {string}   updates[].id
 * @param {string}   updates[].statusId
 * @param {AuthUser} user
 * @returns {Promise<{ count: number, updatedIds: string[] }>}
 * @throws {AppError} Passes through business/ACL AppErrors; wraps unexpected errors as serviceError.
 */
const updateWarehouseInventoryStatusService = async ({
                                                       warehouseId,
                                                       updates,
                                                       user,
                                                     }) => {
  const context = `${CONTEXT}/updateWarehouseInventoryStatusService`;
  
  try {
    const assignedWarehouseIds = await assertWarehouseAccess(user);
    enforceWarehouseScope(assignedWarehouseIds, warehouseId);
    
    return await withTransaction(async (client) => {
      const ids = updates.map((u) => u.id);
      const previousRecords = await fetchWarehouseInventoryStateByIds(ids, warehouseId, client);
      
      assertAllInventoryRecordsFound(ids, previousRecords);
      
      // Validate all status IDs exist
      const statusIds = [...new Set(updates.map((u) => u.statusId))];
      const validStatuses = await validateInventoryStatusIds(statusIds, client);
      
      if (validStatuses.length !== statusIds.length) {
        const foundIds = new Set(validStatuses.map((r) => r.id));
        const invalidIds = statusIds.filter((id) => !foundIds.has(id));
        throw AppError.validationError(
          'One or more invalid inventory status IDs.',
          { context, meta: { invalidStatusIds: invalidIds } }
        );
      }
      
      const actionTypeId = getStatusId('action_manual_stock_adjust');
      
      if (!actionTypeId) {
        throw AppError.businessError(
          'Status change action type not found. Contact an administrator.'
        );
      }
      
      const updatedRecords = await updateWarehouseInventoryStatusBulk(
        updates, warehouseId, user.id, client
      );
      
      const logEntries = buildStatusChangeLogEntries(
        previousRecords, updatedRecords, actionTypeId, user.id
      );
      
      await insertInventoryActivityLogBulk(logEntries, client);
      
      return {
        count:      updatedRecords.length,
        updatedIds: updatedRecords.map((r) => r.id),
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError(
      'Unable to update warehouse inventory status at this time.',
      {
        context,
        meta: { error: error.message },
      }
    );
  }
};

// ── Update metadata ─────────────────────────────────────────────────

/**
 * Updates inbound date and warehouse fee for a single inventory record.
 *
 * No activity log is written — metadata corrections are not quantity
 * or status changes and are not tracked in the inventory audit trail.
 *
 * @param {string}  warehouseId
 * @param {string}  id
 * @param {object}  fields
 * @param {string}  [fields.inboundDate]
 * @param {number}  [fields.warehouseFee]
 * @param {AuthUser} user
 * @returns {Promise<{ id: string, inboundDate: string, warehouseFee: number, updatedAt: string }>}
 * @throws {AppError} Passes through business/ACL AppErrors; wraps unexpected errors as serviceError.
 */
const updateWarehouseInventoryMetadataService = async ({
                                                         warehouseId,
                                                         id,
                                                         fields,
                                                         user,
                                                       }) => {
  const context = `${CONTEXT}/updateWarehouseInventoryMetadataService`;
  
  try {
    const assignedWarehouseIds = await assertWarehouseAccess(user);
    enforceWarehouseScope(assignedWarehouseIds, warehouseId);
    
    return await withTransaction(async (client) => {
      const updated = await updateWarehouseInventoryMetadata({
        id,
        warehouseId,
        inboundDate:  fields.inboundDate,
        warehouseFee: fields.warehouseFee ?? null,
        updatedBy:    user.id,
      }, client);
      
      if (!updated) {
        throw AppError.notFoundError('Warehouse inventory record not found.');
      }
      
      // No activity log for metadata corrections — not a quantity or status change
      
      return {
        id:          updated.id,
        inboundDate: updated.inbound_date,
        warehouseFee: updated.warehouse_fee,
        updatedAt:   updated.updated_at,
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError(
      'Unable to update warehouse inventory metadata at this time.',
      {
        context,
        meta: { error: error.message },
      }
    );
  }
};

// ── Record outbound ─────────────────────────────────────────────────

/**
 * Bulk records outbound stock movement for warehouse inventory records.
 *
 * Validates warehouse access and outbound record rules, fetches pre-mutation
 * state for log generation, applies updates, and writes activity log entries.
 *
 * @param {string}   warehouseId
 * @param {object[]} updates
 * @param {string}   updates[].id
 * @param {string}   updates[].outboundDate
 * @param {number}   updates[].warehouseQuantity
 * @param {AuthUser} user
 * @returns {Promise<{ count: number, updatedIds: string[] }>}
 * @throws {AppError} Passes through business/ACL AppErrors; wraps unexpected errors as serviceError.
 */
const recordWarehouseInventoryOutboundService = async ({
                                                         warehouseId,
                                                         updates,
                                                         user,
                                                       }) => {
  const context = `${CONTEXT}/recordWarehouseInventoryOutboundService`;
  
  try {
    const assignedWarehouseIds = await assertWarehouseAccess(user);
    enforceWarehouseScope(assignedWarehouseIds, warehouseId);
    
    validateOutboundRecords(updates);
    
    return await withTransaction(async (client) => {
      const ids = updates.map((u) => u.id);
      const previousRecords = await fetchWarehouseInventoryStateByIds(ids, warehouseId, client);
      
      assertAllInventoryRecordsFound(ids, previousRecords);
      
      const actionTypeId = getStatusId('action_fulfilled');
      
      if (!actionTypeId) {
        throw AppError.businessError(
          'Outbound action type not found. Contact an administrator.'
        );
      }
      
      const updatedRecords = await updateWarehouseInventoryOutboundBulk(
        updates, warehouseId, user.id, client
      );
      
      const logEntries = buildOutboundLogEntries(
        previousRecords, updatedRecords, actionTypeId, user.id
      );
      
      await insertInventoryActivityLogBulk(logEntries, client);
      
      return {
        count:      updatedRecords.length,
        updatedIds: updatedRecords.map((r) => r.id),
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError(
      'Unable to record warehouse inventory outbound at this time.',
      {
        context,
        meta: { error: error.message },
      }
    );
  }
};

/**
 * Fetches the full detail view for a single warehouse inventory record,
 * including zone assignments and recent movement history.
 *
 * @param {string}   warehouseId
 * @param {string}   inventoryId
 * @param {AuthUser} user
 * @returns {Promise<WarehouseInventoryDetailRecord & { zones: object[], recentMovements: object[] }>}
 * @throws {AppError} Passes through business/ACL AppErrors; wraps unexpected errors as serviceError.
 */
const getWarehouseInventoryDetailService = async ({
                                                    warehouseId,
                                                    inventoryId,
                                                    user,
                                                  }) => {
  const context = `${CONTEXT}/getWarehouseInventoryDetailService`;
  
  try {
    // 1. Warehouse scope check
    const assignedWarehouseIds = await assertWarehouseAccess(user);
    enforceWarehouseScope(assignedWarehouseIds, warehouseId);
    
    // 2. Fetch inventory detail
    const row = await getWarehouseInventoryDetailById(inventoryId, warehouseId);
    
    if (!row) {
      throw AppError.notFoundError('Warehouse inventory record not found.');
    }
    
    // 3. Fetch zones and movements in parallel
    const [zoneRows, movementRows] = await Promise.all([
      getWarehouseZonesByInventoryId(inventoryId),
      getWarehouseMovementsByInventoryId(inventoryId),
    ]);
    
    // 4. Transform and compose response
    return {
      ...transformWarehouseInventoryDetailRecord(row),
      zones:           transformWarehouseZones(zoneRows),
      recentMovements: transformWarehouseMovements(movementRows),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError(
      'Unable to retrieve warehouse inventory detail at this time.',
      {
        context,
        meta: { error: error.message }
      }
    );
  }
};

/**
 * Fetches the warehouse summary including quantity totals, batch-type
 * breakdown, and per-status breakdown for a given warehouse.
 * Enforces warehouse scope before querying.
 *
 * @param {string}   warehouseId
 * @param {AuthUser} user
 * @returns {Promise<object>}
 * @throws {AppError} Passes through ACL and not-found AppErrors; wraps unexpected errors as serviceError.
 */
const getWarehouseSummaryService = async ({ warehouseId, user }) => {
  const context = `${CONTEXT}/getWarehouseSummaryService`;
  
  try {
    const assignedWarehouseIds = await assertWarehouseAccess(user);
    enforceWarehouseScope(assignedWarehouseIds, warehouseId);
    
    const [summaryRow, statusRows] = await Promise.all([
      getWarehouseSummary(warehouseId),
      getWarehouseSummaryByStatus(warehouseId),
    ]);
    
    if (!summaryRow) {
      throw AppError.notFoundError('Warehouse not found.');
    }
    
    return transformWarehouseSummary(
      /** @type {WarehouseSummaryRow} */ (summaryRow),
      statusRows
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError(
      'Unable to retrieve warehouse summary at this time.',
      {
        context,
        meta: { error: error.message }
      }
    );
  }
};

/**
 * Fetches product and packaging material quantity summaries for a given warehouse,
 * optionally filtered to a single batch type. Both types are fetched in parallel
 * when no batch type filter is applied.
 *
 * @param {string}   warehouseId
 * @param {string}   [batchType]  - 'product' | 'packaging_material' — omit for both.
 * @param {AuthUser} user
 * @returns {Promise<{ products: object[], packagingMaterials: object[] }>}
 * @throws {AppError} Passes through ACL AppErrors; wraps unexpected errors as serviceError.
 */
const getWarehouseItemSummaryService = async ({ warehouseId, batchType, user }) => {
  const context = `${CONTEXT}/getWarehouseItemSummaryService`;
  
  try {
    const assignedWarehouseIds = await assertWarehouseAccess(user);
    enforceWarehouseScope(assignedWarehouseIds, warehouseId);
    
    const fetchProduct   = !batchType || batchType === 'product';
    const fetchPackaging = !batchType || batchType === 'packaging_material';
    
    const [productRows, packagingRows] = await Promise.all([
      fetchProduct   ? getWarehouseProductSummary(warehouseId)   : Promise.resolve([]),
      fetchPackaging ? getWarehousePackagingSummary(warehouseId) : Promise.resolve([]),
    ]);
    
    return {
      products:           fetchProduct   ? transformWarehouseProductSummary(productRows)     : [],
      packagingMaterials: fetchPackaging ? transformWarehousePackagingSummary(packagingRows) : [],
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError(
      'Unable to retrieve warehouse item summary at this time.',
      {
        context,
        meta: { error: error.message }
      }
    );
  }
};

module.exports = {
  fetchPaginatedWarehouseInventoryService,
  createWarehouseInventoryService,
  adjustWarehouseInventoryQuantityService,
  updateWarehouseInventoryStatusService,
  updateWarehouseInventoryMetadataService,
  recordWarehouseInventoryOutboundService,
  getWarehouseInventoryDetailService,
  getWarehouseSummaryService,
  getWarehouseItemSummaryService,
};

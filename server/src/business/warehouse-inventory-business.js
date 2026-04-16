/**
 * @file warehouse-inventory-business.js
 * @description
 * Business-layer logic for warehouse inventory operations.
 *
 * Covers ACL evaluation and filter application for inventory visibility,
 * warehouse scope enforcement, inbound batch and quantity validation,
 * status transition rules, inventory status resolution, activity log entry
 * construction, and SHA-256 checksum generation for log integrity.
 *
 * Exports:
 *
 * ─── ACL & Visibility ─────────────────────────────────────────────────────────
 *  - evaluateWarehouseInventoryVisibility          — resolve visibility ACL for the current user
 *  - applyWarehouseInventoryVisibilityRules        — apply ACL rules to filter object
 *  - assertWarehouseAccess                         — resolve assigned warehouse IDs for the user
 *  - enforceWarehouseScope                         — throw if user lacks access to target warehouse
 *
 * ─── Validation ───────────────────────────────────────────────────────────────
 *  - validateInboundBatches                        — verify batch IDs exist and are not duplicated
 *  - validateInboundQuantities                     — validate positive integer quantities on inbound records
 *  - validateQuantityAdjustments                   — validate non-negative quantities and reserved constraints
 *  - validateOutboundRecords                       — validate outbound date and quantity on outbound records
 *  - assertAllInventoryRecordsFound                — throw if any expected inventory IDs are missing
 *  - assertValidStatusTransition                   — enforce allowed status transition rules
 *
 * ─── Status Resolution ────────────────────────────────────────────────────────
 *  - resolveInboundStatus                          — resolve default or requested inbound status UUID
 *  - resolveInventoryStatus                        — derive in-stock or out-of-stock status ID from quantity
 *
 * ─── Activity Log Builders ────────────────────────────────────────────────────
 *  - buildInboundActivityLogEntries                — build log entries for newly inserted inbound records
 *  - buildQuantityAdjustmentLogEntries             — build log entries for quantity adjustment operations
 *  - buildStatusChangeLogEntries                   — build log entries for status update operations
 *  - buildOutboundLogEntries                       — build log entries for outbound movement operations
 *  - buildAllocationConfirmLogEntries              — build log entries for reserved quantity changes
 *                                                    triggered by order allocation confirmation
 */

'use strict';

const AppError = require('../utils/AppError');
const { resolveUserPermissionContext } = require('../services/permission-service');
const { logSystemException } = require('../utils/logging/system-logger');
const { getWarehouseIdsByUserId } = require('../repositories/user-warehouse-assignment-repository');
const { applyBatchTypeVisibility } = require('./apply-batch-type-visibility');
const { PERMISSIONS } = require('../utils/constants/domain/warehouse-inventory');
const { validateBatchRegistryIds } = require('../repositories/batch-registry-repository');
const { findExistingInventoryByBatchIds } = require('../repositories/warehouse-inventory-repository');
const { getStatusId } = require('../config/status-cache');
const { getInventoryStatusById } = require('../repositories/inventory-status-repository');
const { computeLogChecksum } = require('../utils/hash-utils');
const { cleanObject } = require('../utils/object-utils');

const CONTEXT = 'warehouse-inventory-business';

// ── Visibility ACL (existing) ───────────────────────────────────────

/**
 * Resolves warehouse inventory visibility capabilities for the given user.
 *
 * `canViewAllWarehouses` short-circuits warehouse scope — if true,
 * user can view inventory at any warehouse.
 *
 * Batch-type visibility flags follow the same pattern as batch registry ACL.
 *
 * @param {AuthUser} user
 * @returns {Promise<WarehouseInventoryVisibilityAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateWarehouseInventoryVisibility = async (user) => {
  const context = `${CONTEXT}/evaluateWarehouseInventoryVisibility`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    // ─── Warehouse scope ───────────────────────────────────────────────────────
    
    const canViewAllWarehouses =
      isRoot ||
      permissions.includes(PERMISSIONS.VIEW_ALL_WAREHOUSES);
    
    let assignedWarehouseIds = null;
    
    if (!canViewAllWarehouses) {
      assignedWarehouseIds = await getWarehouseIdsByUserId(user.id);
    }
    
    // ─── Batch-type visibility ─────────────────────────────────────────────────
    
    const canViewAllBatchTypes =
      isRoot ||
      permissions.includes(PERMISSIONS.VIEW_ALL_BATCH_TYPES);
    
    const canViewProductBatches =
      canViewAllBatchTypes ||
      permissions.includes(PERMISSIONS.VIEW_PRODUCT_INVENTORY);
    
    const canViewPackagingBatches =
      canViewAllBatchTypes ||
      permissions.includes(PERMISSIONS.VIEW_PACKAGING_INVENTORY);
    
    // ─── Field-level visibility ────────────────────────────────────────────────
    
    const canViewFinancials =
      isRoot ||
      permissions.includes(PERMISSIONS.VIEW_INVENTORY_FINANCIALS);
    
    const canViewManufacturer =
      canViewAllBatchTypes ||
      permissions.includes(PERMISSIONS.VIEW_INVENTORY_MANUFACTURER);
    
    const canViewSupplier =
      canViewAllBatchTypes ||
      permissions.includes(PERMISSIONS.VIEW_INVENTORY_SUPPLIER);
    
    return {
      // Warehouse scope
      canViewAllWarehouses,
      assignedWarehouseIds,
      
      // Batch-type visibility
      canViewAllBatchTypes,
      canViewProductBatches,
      canViewPackagingBatches,
      
      // Field-level visibility
      canViewFinancials,
      canViewManufacturer,
      canViewSupplier,
      
      // Derived search capabilities
      canSearchProduct:           canViewProductBatches,
      canSearchSku:               canViewProductBatches,
      canSearchManufacturer:      canViewManufacturer,
      canSearchPackagingMaterial: canViewPackagingBatches,
      canSearchSupplier:          canViewSupplier,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate warehouse inventory visibility', {
      context,
      userId: user?.id,
    });
    
    throw AppError.businessError(
      'Unable to evaluate warehouse inventory visibility.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a warehouse inventory filter object.
 *
 * Evaluation order:
 *  1. Warehouse scope — user must have access to the requested warehouse.
 *  2. Batch-type narrowing — same logic as batch registry ACL.
 *  3. Keyword capabilities — injected for search clause scoping.
 *
 * @param {object} filters
 * @param {string} filters.warehouseId
 * @param {WarehouseInventoryVisibilityAcl} acl
 * @returns {object} Adjusted copy of filters with visibility rules applied.
 */
const applyWarehouseInventoryVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };
  
  // ─── 1. Warehouse scope ──────────────────────────────────────────────────────
  
  if (
    !acl.canViewAllWarehouses &&
    !acl.assignedWarehouseIds.includes(filters.warehouseId)
  ) {
    adjusted.forceEmptyResult = true;
    return adjusted;
  }
  
  // ─── 2. Batch-type visibility ────────────────────────────────────────────────
  
  return applyBatchTypeVisibility(adjusted, acl);
};

// ── Warehouse scope check ───────────────────────────────────────────

/**
 * Validates that the user has access to the target warehouse.
 *
 * @param {AuthUser} user
 * @returns {Promise<string[]>}
 * @throws {AppError} forbiddenError if user lacks access.
 */
const assertWarehouseAccess = async (user) => {
  const context = `${CONTEXT}/assertWarehouseAccess`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    const canViewAll =
      isRoot ||
      permissions.includes(PERMISSIONS.VIEW_ALL_WAREHOUSES);
    
    if (canViewAll) return null;

    return await getWarehouseIdsByUserId(user.id);
  } catch (err) {
    logSystemException(err, 'Failed to resolve warehouse access', {
      context,
      userId: user?.id,
    });
    
    throw AppError.businessError('Unable to verify warehouse access.');
  }
};

/**
 * @param {string[]} assignedWarehouseIds - Null if user has unrestricted access.
 * @param {string}   warehouseId
 * @throws {AppError} authorizationError if user lacks access to the warehouse.
 */
const enforceWarehouseScope = (assignedWarehouseIds, warehouseId) => {
  if (assignedWarehouseIds === null) return;
  
  if (!assignedWarehouseIds.includes(warehouseId)) {
    throw AppError.authorizationError(
      'You do not have access to this warehouse.'
    );
  }
};

// ── Batch validation ────────────────────────────────────────────────

/**
 * Validates that all batch IDs exist in batch_registry and none
 * already have inventory at the target warehouse.
 *
 * @param {string[]} batchIds
 * @param {string} warehouseId
 * @param {PoolClient} client
 * @returns {Promise<void>}
 * @throws {AppError} validationError if any batch is invalid or duplicated.
 */
const validateInboundBatches = async (batchIds, warehouseId, client) => {
  const existingBatches = await validateBatchRegistryIds(batchIds, client);
  
  const foundIds = new Set(existingBatches.map((r) => r.id));
  const missingIds = batchIds.filter((id) => !foundIds.has(id));
  
  if (missingIds.length > 0) {
    throw AppError.validationError(
      'One or more batch IDs do not exist in the registry.',
      { meta: { missingBatchIds: missingIds } }
    );
  }
  
  const existingInventory = await findExistingInventoryByBatchIds(
    warehouseId, batchIds, client
  );
  
  if (existingInventory.length > 0) {
    throw AppError.validationError(
      'One or more batches already have inventory at this warehouse.',
      { meta: { duplicateBatchIds: existingInventory.map((r) => r.batch_id) } }
    );
  }
};

// ── Status resolution ───────────────────────────────────────────────

/**
 * Allowed status transitions keyed by current status name.
 * @type {Record<string, string[]>}
 */
const VALID_STATUS_TRANSITIONS = {
  in_stock:     ['quarantined', 'reserved', 'damaged', 'expired'],
  quarantined:  ['in_stock', 'damaged', 'expired'],
  reserved:     ['in_stock', 'fulfilled'],
  damaged:      ['disposed'],
  expired:      ['disposed'],
  fulfilled:    [],
  disposed:     [],
};

/**
 * Asserts that the requested status transition is permitted.
 *
 * @param {string} currentStatusName
 * @param {string} newStatusName
 * @throws {AppError} validationError if the transition is not allowed.
 */
const assertValidStatusTransition = (currentStatusName, newStatusName) => {
  const allowed = VALID_STATUS_TRANSITIONS[currentStatusName];
  
  if (!allowed || !allowed.includes(newStatusName)) {
    throw AppError.validationError(
      `Cannot transition from "${currentStatusName}" to "${newStatusName}".`,
      { meta: { currentStatusName, newStatusName } }
    );
  }
};

/**
 * Resolves the default inventory status for inbound records.
 *
 * @param {PoolClient} client
 * @param {string} [requestedStatusId] - Explicit status from request, if any.
 * @returns {Promise<string>} Resolved status UUID.
 * @throws {AppError} if no valid inbound status can be resolved.
 */
const resolveInboundStatus = async (client, requestedStatusId) => {
  if (requestedStatusId) {
    const status = await getInventoryStatusById(requestedStatusId, client);
    if (!status) {
      throw AppError.validationError('Invalid inventory status ID.', {
        meta: { statusId: requestedStatusId },
      });
    }
    return requestedStatusId;
  }
  
  return getStatusId('inventory_in_stock');
};

// ── Quantity validation ─────────────────────────────────────────────

/**
 * Validates inbound quantity rules for bulk insert records.
 *
 * @param {object[]} records
 * @param {number}   records[].warehouseQuantity
 * @throws {AppError} validationError if any quantity is invalid.
 */
const validateInboundQuantities = (records) => {
  const invalidIndices = [];
  
  records.forEach((record, index) => {
    if (
      record.warehouseQuantity == null ||
      record.warehouseQuantity <= 0 ||
      !Number.isInteger(record.warehouseQuantity)
    ) {
      invalidIndices.push(index);
    }
  });
  
  if (invalidIndices.length > 0) {
    throw AppError.validationError(
      'Inbound quantity must be a positive integer for all records.',
      { meta: { invalidIndices } }
    );
  }
};

// ── Activity log generation ─────────────────────────────────────────

/**
 * Builds activity log entries for newly inserted inbound inventory records.
 *
 * @param {object[]} insertedRecords - Rows returned from insertWarehouseInventoryBulk.
 * @param {string} actionTypeId - UUID for the 'inbound' action type.
 * @param {string} performedBy - User UUID.
 * @returns {object[]}
 */
const buildInboundActivityLogEntries = (insertedRecords, actionTypeId, performedBy) =>
  insertedRecords.map((record) => ({
    warehouse_inventory_id: record.id,
    inventory_action_type_id: actionTypeId,
    adjustment_type_id: null,
    previous_quantity: 0,
    quantity_change: record.warehouse_quantity,
    new_quantity: record.warehouse_quantity,
    status_id: record.status_id,
    status_effective_at: record.status_date,
    reference_type: null,
    reference_id: null,
    performed_by: performedBy,
    comments: null,
    checksum: computeLogChecksum({
      warehouseInventoryId: record.id,
      actionTypeId,
      previousQuantity: 0,
      quantityChange: record.warehouse_quantity,
      newQuantity: record.warehouse_quantity,
      performedBy,
      performedAt: record.created_at,
    }),
    metadata: null,
    created_by: performedBy,
  }));

// ── Quantity adjustment validation ──────────────────────────────────

/**
 * @param {object[]} updates
 * @param {number} updates[].warehouseQuantity
 * @param {number} updates[].reservedQuantity
 * @throws {AppError} validationError if any quantities are invalid.
 */
const validateQuantityAdjustments = (updates) => {
  const invalidIndices = [];
  
  updates.forEach((update, index) => {
    if (
      update.warehouseQuantity == null ||
      update.warehouseQuantity < 0 ||
      !Number.isInteger(update.warehouseQuantity)
    ) {
      invalidIndices.push(index);
      return;
    }
    
    const reserved = update.reservedQuantity ?? 0;
    if (reserved < 0 || !Number.isInteger(reserved)) {
      invalidIndices.push(index);
      return;
    }
    
    if (reserved > update.warehouseQuantity) {
      invalidIndices.push(index);
    }
  });
  
  if (invalidIndices.length > 0) {
    throw AppError.validationError(
      'Invalid quantity values. Warehouse quantity must be a non-negative integer and reserved must not exceed warehouse quantity.',
      { meta: { invalidIndices } }
    );
  }
};

// ── Outbound validation ─────────────────────────────────────────────

/**
 * @param {object[]} updates
 * @param {number} updates[].warehouseQuantity
 * @param {string} updates[].outboundDate
 * @throws {AppError} validationError if any outbound records are invalid.
 */
const validateOutboundRecords = (updates) => {
  const invalidIndices = [];
  
  updates.forEach((update, index) => {
    if (
      update.warehouseQuantity == null ||
      update.warehouseQuantity < 0 ||
      !Number.isInteger(update.warehouseQuantity)
    ) {
      invalidIndices.push(index);
      return;
    }
    
    if (!update.outboundDate) {
      invalidIndices.push(index);
    }
  });
  
  if (invalidIndices.length > 0) {
    throw AppError.validationError(
      'Outbound records require a valid date and non-negative quantity.',
      { meta: { invalidIndices } }
    );
  }
};

// ── Activity log builders ───────────────────────────────────────────

/**
 * @param {object[]} previousRecords
 * @param {object[]} updatedRecords
 * @param {string}   actionTypeId
 * @param {string}   adjustmentTypeId
 * @param {string}   performedBy
 * @returns {object[]}
 */
const buildQuantityAdjustmentLogEntries = (
  previousRecords,
  updatedRecords,
  actionTypeId,
  adjustmentTypeId,
  performedBy
) =>
  updatedRecords.map((updated) => {
    const previous = previousRecords.find((r) => r.id === updated.id);
    const prevQty = previous?.warehouse_quantity ?? 0;
    const newQty = updated.warehouse_quantity;
    
    return {
      warehouse_inventory_id:   updated.id,
      inventory_action_type_id: actionTypeId,
      adjustment_type_id:       adjustmentTypeId,
      previous_quantity:        prevQty,
      quantity_change:          newQty - prevQty,
      new_quantity:             newQty,
      status_id:                updated.status_id,
      status_effective_at:      null,
      reference_type:           null,
      reference_id:             null,
      performed_by:             performedBy,
      comments:                 null,
      checksum: computeLogChecksum({
        warehouseInventoryId: updated.id,
        actionTypeId,
        previousQuantity:     prevQty,
        quantityChange:       newQty - prevQty,
        newQuantity:          newQty,
        performedBy,
        performedAt:          updated.updated_at,
      }),
      metadata: null,
      created_by: performedBy,
    };
  });

/**
 * @param {object[]} previousRecords
 * @param {object[]} updatedRecords
 * @param {string}   actionTypeId
 * @param {string}   performedBy
 * @returns {object[]}
 */
const buildStatusChangeLogEntries = (
  previousRecords,
  updatedRecords,
  actionTypeId,
  performedBy
) =>
  updatedRecords.map((updated) => {
    const previous = previousRecords.find((r) => r.id === updated.id);
    
    return {
      warehouse_inventory_id:   updated.id,
      inventory_action_type_id: actionTypeId,
      adjustment_type_id:       null,
      previous_quantity:        updated.warehouse_quantity,
      quantity_change:          0,
      new_quantity:             updated.warehouse_quantity,
      status_id:                updated.status_id,
      status_effective_at:      updated.status_date,
      reference_type:           null,
      reference_id:             null,
      performed_by:             performedBy,
      comments:                 null,
      checksum: computeLogChecksum({
        warehouseInventoryId: updated.id,
        actionTypeId,
        previousQuantity:     updated.warehouse_quantity,
        quantityChange:       0,
        newQuantity:          updated.warehouse_quantity,
        performedBy,
        performedAt:          updated.updated_at,
      }),
      metadata: {
        previousStatusId: previous?.status_id ?? null,
        newStatusId:       updated.status_id,
      },
      created_by: performedBy,
    };
  });

/**
 * @param {object[]} previousRecords
 * @param {object[]} updatedRecords
 * @param {string} actionTypeId
 * @param {string} performedBy
 * @returns {object[]}
 */
const buildOutboundLogEntries = (
  previousRecords,
  updatedRecords,
  actionTypeId,
  performedBy
) =>
  updatedRecords.map((updated) => {
    const previous = previousRecords.find((r) => r.id === updated.id);
    const prevQty = previous?.warehouse_quantity ?? 0;
    const newQty = updated.warehouse_quantity;
    
    return {
      warehouse_inventory_id:   updated.id,
      inventory_action_type_id: actionTypeId,
      adjustment_type_id:       null,
      previous_quantity:        prevQty,
      quantity_change:          newQty - prevQty,
      new_quantity:             newQty,
      status_id:                updated.status_id,
      status_effective_at:      null,
      reference_type:           null,
      reference_id:             null,
      performed_by:             performedBy,
      comments:                 null,
      checksum: computeLogChecksum({
        warehouseInventoryId: updated.id,
        actionTypeId,
        previousQuantity:     prevQty,
        quantityChange:       newQty - prevQty,
        newQuantity:          newQty,
        performedBy,
        performedAt:          updated.updated_at,
      }),
      metadata: {
        outboundDate: updated.outbound_date,
      },
      created_by: performedBy,
    };
  });

/**
 * @param {string[]} expectedIds
 * @param {object[]} foundRecords
 * @throws {AppError} notFoundError if any IDs are missing.
 */
const assertAllInventoryRecordsFound = (expectedIds, foundRecords) => {
  if (foundRecords.length === expectedIds.length) return;
  
  const foundIds = new Set(foundRecords.map((r) => r.id));
  const missingIds = expectedIds.filter((id) => !foundIds.has(id));
  
  throw AppError.notFoundError(
    'One or more inventory records not found.',
    { meta: { missingIds } }
  );
};

/**
 * Resolves the inventory status ID based on the resulting warehouse quantity.
 *
 * @param {number} warehouseQuantity
 * @param {{ inStockStatusId: string, outOfStockStatusId: string }} statusIds
 * @returns {string}
 */
const resolveInventoryStatus = (warehouseQuantity, { inStockStatusId, outOfStockStatusId }) => {
  return warehouseQuantity > 0 ? inStockStatusId : outOfStockStatusId;
};

/**
 * Builds inventory activity log entries for warehouse quantity changes
 * triggered by an order allocation confirmation.
 *
 * Maps each updated warehouse inventory row back to its original state using
 * a `warehouse_id__batch_id` keyed lookup, then constructs a log entry
 * reflecting the reserved quantity delta for that row.
 *
 * Pure function — no DB calls, no logging, no side effects.
 *
 * @param {WarehouseBatchUpdate[]} updatedRows           - Computed reservation updates from updateReservedQuantitiesFromAllocations.
 * @param {WarehouseInventoryQuantityRow[]} originalWarehouseInfo - Pre-mutation inventory snapshots from getWarehouseInventoryQuantities.
 * @param {object} options
 * @param {string} options.orderId       - UUID of the order triggering the allocation.
 * @param {string} options.performedBy   - UUID of the acting user.
 * @param {string} options.actionTypeId  - Inventory action type UUID (e.g. `reserve`).
 * @param {string|null} [options.comments=null]  - Optional override for the log comment field.
 *
 * @returns {object[]} Activity log row objects ready for `insertInventoryActivityLogBulk`.
 *
 * @throws {Error} If a matching original record cannot be found for an updated row —
 *                 indicates a data integrity issue between the update and snapshot sets.
 */
const buildAllocationConfirmLogEntries = (
  updatedRows,
  originalWarehouseInfo,
  { orderId, performedBy, actionTypeId, comments = null }
) => {
  const originalMap = Object.fromEntries(
    originalWarehouseInfo.map((record) => [
      `${record.warehouse_id}__${record.batch_id}`,
      record,
    ])
  );
  
  return updatedRows.map((updated) => {
    const key      = `${updated.warehouse_id}__${updated.batch_id}`;
    const original = originalMap[key];
    const performedAt = new Date().toISOString();
    
    if (!original) {
      throw new Error(`Missing original warehouse inventory data for key: ${key}`);
    }
    
    const previousQty = original.reserved_quantity;
    const newQty      = updated.reserved_quantity;
    
    return {
      warehouse_inventory_id:   original.id,
      inventory_action_type_id: actionTypeId,
      adjustment_type_id:       null,
      previous_quantity:        previousQty,
      quantity_change:          newQty - previousQty,
      new_quantity:             newQty,
      status_id:                updated.status_id,
      status_effective_at:      performedAt,
      reference_type:           'order',
      reference_id:             orderId,
      performed_by:             performedBy,
      comments:                 comments ?? 'Reserved quantity updated during order allocation.',
      checksum: computeLogChecksum({
        warehouseInventoryId: original.id,
        actionTypeId:         actionTypeId,
        previousQuantity:     previousQty,
        quantityChange:       newQty - previousQty,
        newQuantity:          newQty,
        performedBy:          performedBy,
        performedAt,
        referenceId:          orderId,
      }),
      metadata: {
        source:       'order_allocation',
        warehouse_id: updated.warehouse_id,
        batch_id:     updated.batch_id,
      },
      created_by: performedBy,
    };
  });
};

/**
 * Builds a single inventory activity log entry for a warehouse quantity
 * change triggered by an outbound fulfillment confirmation.
 *
 * Computes the quantity delta as the negative of the allocated quantity
 * (stock is deducted on fulfillment). The fulfillment ID is used as the
 * `reference_id` and included in the checksum for deduplication.
 *
 * Pure function — no DB calls, no logging, no side effects.
 *
 * @param {object} options
 * @param {object} options.allocation              - Enriched allocation record from enrichAllocationsWithInventory.
 * @param {object} options.update                  - Computed inventory delta from calculateInventoryAdjustments.
 * @param {string} options.inventoryActionTypeId   - Inventory action type UUID (e.g. `fulfilled`).
 * @param {string} options.userId                  - UUID of the acting user.
 * @param {string} options.shipmentId              - UUID of the outbound shipment.
 * @param {string} options.fulfillmentId           - UUID of the fulfillment record (used as reference_id).
 * @param {string} options.orderNumber             - Human-readable order number for the log comment.
 *
 * @returns {object} Activity log row object ready for `insertInventoryActivityLogBulk`.
 */
const buildFulfillmentLogEntry = ({
                                    allocation,
                                    update,
                                    inventoryActionTypeId,
                                    userId,
                                    shipmentId,
                                    fulfillmentId,
                                    orderNumber,
                                  }) => {
  const previousQuantity = allocation.warehouse_quantity;
  const quantityChange   = -allocation.allocated_quantity;
  const newQuantity      = update.warehouse_quantity;
  
  const comments = `[System] Inventory adjusted during fulfillment for order ${orderNumber}`;
  
  const metadata = cleanObject({
    batch_id:                    allocation.batch_id,
    allocation_id:               allocation.allocation_id,
    shipment_id:                 shipmentId,
    fulfillment_id:              fulfillmentId,
    reserved_quantity_before:    allocation.reserved_quantity,
    reserved_quantity_after:     update.reserved_quantity,
    warehouse_quantity_snapshot: previousQuantity,
  });
  
  const checksum = computeLogChecksum({
    warehouseInventoryId: allocation.warehouse_inventory_id,
    actionTypeId:         inventoryActionTypeId,
    previousQuantity,
    quantityChange,
    newQuantity,
    performedBy:          userId,
    performedAt:          new Date().toISOString(),
    referenceId:          fulfillmentId,
  });
  
  return {
    warehouse_inventory_id:   allocation.warehouse_inventory_id,
    inventory_action_type_id: inventoryActionTypeId,
    adjustment_type_id:       null,
    previous_quantity:        previousQuantity,
    quantity_change:          quantityChange,
    new_quantity:             newQuantity,
    status_id:                update.status_id,
    status_effective_at:      new Date().toISOString(),
    reference_type:           'fulfillment',
    reference_id:             fulfillmentId,
    performed_by:             userId,
    comments,
    checksum,
    metadata,
    created_by:               userId,
  };
};

module.exports = {
  evaluateWarehouseInventoryVisibility,
  applyWarehouseInventoryVisibilityRules,
  assertWarehouseAccess,
  enforceWarehouseScope,
  validateInboundBatches,
  resolveInboundStatus,
  assertValidStatusTransition,
  validateInboundQuantities,
  buildInboundActivityLogEntries,
  validateQuantityAdjustments,
  validateOutboundRecords,
  buildQuantityAdjustmentLogEntries,
  buildStatusChangeLogEntries,
  buildOutboundLogEntries,
  assertAllInventoryRecordsFound,
  resolveInventoryStatus,
  buildAllocationConfirmLogEntries,
  buildFulfillmentLogEntry,
};

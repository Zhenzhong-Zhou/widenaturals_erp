const { getStatusId } = require('../config/status-cache');
const { getWarehouseInventoryQuantities } = require('../repositories/warehouse-inventory-repository');
const AppError = require('../utils/AppError');
const { InventorySourceTypes } = require('../utils/constants/domain/inventory-source-types');
const { getLocationInventoryQuantities } = require('../repositories/location-inventory-repository');
const { logSystemException } = require('../utils/system-logger');
const { validateBatchRegistryEntryById } = require('./batch-registry-business');
const { deduplicateByCompositeKey } = require('../utils/array-utils');

const MAX_BULK_UPDATE = 20;

const computeInventoryAdjustments = async (records, client) => {
  try {
    if (!Array.isArray(records) || records.length === 0) {
      throw AppError.validationError('No inventory updates provided.');
    }
    
    if (records.length > MAX_BULK_UPDATE) {
      throw AppError.validationError(`Bulk update limit is ${MAX_BULK_UPDATE} records.`);
    }
    
    // Step 1: Validate batch registry references
    await Promise.all(
      records.map((r) =>
        validateBatchRegistryEntryById(r.batch_type, r.batch_id, client)
      )
    );
    
    // Step 2: Normalize quantities
    const warehouseRecords = records.map((r) => ({
      ...r,
      warehouse_quantity: r.quantity ?? 0,
    }));
    const locationRecords = records.map((r) => ({
      ...r,
      location_quantity: r.quantity ?? 0,
    }));
    
    // Step 3: Deduplicate
    const dedupedWarehouse = deduplicateByCompositeKey(warehouseRecords, ['warehouse_id', 'batch_id'], (a, b) => {
      a.warehouse_quantity += b.warehouse_quantity ?? 0;
    });
    
    const dedupedLocation = deduplicateByCompositeKey(locationRecords, ['location_id', 'batch_id'], (a, b) => {
      a.location_quantity += b.location_quantity ?? 0;
    });
    
    // Step 4: Merge deduped updates into a single array
    const updates = [...dedupedWarehouse, ...dedupedLocation];
    
    // Step 5: Call original adjustment logic (unchanged below)
    return await computeInventoryAdjustmentsCore(updates, client);
    
  } catch (error) {
    const message = 'Failed to compute inventory adjustments due to unexpected system error.';
    logSystemException(error, message, {
      context: 'inventory-business/computeInventoryAdjustments',
      records,
    });
    throw AppError.businessError(message);
  }
};

/**
 * Computes inventory updates and audit logs based on the provided quantity adjustments.
 *
 * Responsibilities:
 * - Fetches current warehouse/location inventory records
 * - Validates that reserved quantities do not exceed the updated target quantities
 * - Determines inventory status (`in_stock` or `out_stock`) based on final quantity
 * - Prepares update payloads and audit log records
 *
 * @param updates - An object keyed by unique identifiers, where each entry includes:
 *   - `warehouse_id`, `location_id`, `batch_id`
 *   - `warehouse_quantity`, `location_quantity`
 *   - `inventory_action_type_id`, `adjustment_type_id`, `comments`, and optional `meta`
 * @param client - Postgres client used for querying inside a transaction
 * @returns An object containing:
 *   - `warehouseInventoryUpdates`, `locationInventoryUpdates`: Maps of updates to apply
 *   - `warehouseCompositeKeys`, `locationCompositeKeys`: Keys for optional locking
 *   - `logRecords`: Prepared audit log rows
 * @throws AppError if validation fails or records are missing
 */
const computeInventoryAdjustmentsCore = async (updates, client) => {
  try {
    const warehouseInventoryUpdates = {};
    const warehouseCompositeKeys = [];
    
    const locationInventoryUpdates = {};
    const locationCompositeKeys = [];
    
    const logRecords = [];
    
    const inStockId = getStatusId('inventory_in_stock');
    const outOfStockId = getStatusId('inventory_out_of_stock');
    
    for (const key of Object.keys(updates)) {
      const {
        warehouse_id,
        location_id,
        batch_id,
        quantity,
        inventory_action_type_id,
        adjustment_type_id,
        comments,
        user_id,
        meta = {},
      } = updates[key];
      
      // --- Warehouse Inventory ---
      let warehouseRecord, locationRecord;
      if (warehouse_id && batch_id) {
        warehouseRecord = await getWarehouseInventoryQuantities([{ warehouse_id, batch_id }], client);
        if (warehouseRecord.length === 0) {
          throw AppError.notFoundError(`No matching warehouse inventory record for ${key}`);
        }
        
        const {
          id,
          warehouse_quantity: currentQty,
          reserved_quantity: reservedQty,
        } = warehouseRecord[0];
        
        if (reservedQty > quantity) {
          throw AppError.validationError(`Reserved quantity exceeds updated quantity for ${key}`);
        }
        
        const diffQty = quantity - currentQty;
        const status_id = quantity > 0 ? inStockId : outOfStockId;
        
        warehouseInventoryUpdates[`${warehouse_id}-${batch_id}`] = {
          warehouse_quantity : quantity,
          status_id,
          last_update: new Date().toISOString(),
        };
        warehouseCompositeKeys.push({ warehouse_id, batch_id });
        
        logRecords.push({
          warehouse_inventory_id: id,
          quantity,
          previous_quantity: currentQty,
          quantity_change: diffQty,
          status_id,
          status_date: new Date().toISOString(),
          user_id,
          inventory_action_type_id,
          adjustment_type_id,
          comments: comments ?? null,
          source_type: InventorySourceTypes.MANUAL_UPDATE,
          source_ref_id: null,
          meta,
        });
      }
      
      // --- Location Inventory ---
      if (location_id && batch_id) {
        locationRecord = await getLocationInventoryQuantities([{ location_id, batch_id }], client);
        if (locationRecord.length === 0) {
          throw AppError.notFoundError(`No matching location inventory record for ${key}`);
        }
        
        const { id, location_quantity: currentQty, reserved_quantity: reservedQty } = locationRecord[0];
        if (reservedQty > quantity) {
          throw AppError.validationError(`Reserved quantity exceeds updated location quantity for ${key}`);
        }
        
        const diffQty = quantity - currentQty;
        const status_id = quantity > 0 ? inStockId : outOfStockId;
        
        locationInventoryUpdates[`${location_id}-${batch_id}`] = {
          location_quantity: quantity,
          status_id,
          last_update: new Date().toISOString(),
        };
        locationCompositeKeys.push({ location_id, batch_id });
        
        logRecords.push({
          location_inventory_id: id,
          quantity,
          previous_quantity: currentQty,
          quantity_change: diffQty,
          status_id,
          status_date: new Date().toISOString(),
          user_id,
          inventory_action_type_id,
          adjustment_type_id,
          comments: comments ?? null,
          source_type: InventorySourceTypes.MANUAL_UPDATE,
          source_ref_id: null,
          meta,
        });
      }
    }
    
    return {
      warehouseInventoryUpdates,
      locationInventoryUpdates,
      warehouseCompositeKeys,
      locationCompositeKeys,
      logRecords,
    };
  } catch (error) {
    const message = 'Failed to compute inventory adjustments due to unexpected system error.'
    logSystemException(error, message, {
      context: 'inventory-business/computeInventoryAdjustments',
      updates,
    });
    throw AppError.businessError(message);
  }
};

module.exports = {
  computeInventoryAdjustments,
};

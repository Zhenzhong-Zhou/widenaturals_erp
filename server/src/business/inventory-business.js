const { getStatusId } = require('../config/status-cache');
const { getWarehouseInventoryQuantities } = require('../repositories/warehouse-inventory-repository');
const AppError = require('../utils/AppError');
const { InventorySourceTypes } = require('../utils/constants/domain/inventory-source-types');
const { getLocationInventoryQuantities } = require('../repositories/location-inventory-repository');
const { logSystemException } = require('../utils/system-logger');
const { validateBatchRegistryEntryById } = require('./batch-registry-business');
const { deduplicateByCompositeKey } = require('../utils/array-utils');

/**
 * Validates and normalizes inventory input records before insertion or adjustment.
 *
 * Responsibilities:
 * - Ensures input is a non-empty array and within allowed bulk size.
 * - Validates batch registry references using `batch_type` and `batch_id`.
 * - Normalizes quantity fields (`warehouse_quantity`, `location_quantity`).
 * - Deduplicates warehouse and location records by composite key (`warehouse_id` + `batch_id`, `location_id` + `batch_id`).
 *
 * @param {Array<Object>} records - Raw inventory records from the request payload.
 * @param {import('pg').PoolClient} client - PostgreSQL client within a transaction context.
 *
 * @returns {Promise<{ dedupedWarehouseRecords: Array<Object>, dedupedLocationRecords: Array<Object> }>}
 *   Object containing deduplicated warehouse and location records.
 *
 * @throws {AppError} If validation fails or unexpected system error occurs.
 */
const MAX_BULK_RECORDS = 20;

const validateAndNormalizeInventoryRecords = async (records, client) => {
  try {
    // Step 1: Validate input type and size
    if (!Array.isArray(records) || records.length === 0) {
      throw AppError.validationError('No inventory records provided.');
    }
    if (records.length > MAX_BULK_RECORDS) {
      throw AppError.validationError(`Bulk limit is ${MAX_BULK_RECORDS} records.`);
    }
    
    // Step 2: Validate batch registry existence
    await Promise.all(
      records.map((r) =>
        validateBatchRegistryEntryById(r.batch_type, r.batch_id, client)
      )
    );
    
    // Step 3: Normalize warehouse and location quantities
    const warehouseRecords = records.map((r) => ({
      ...r,
      warehouse_quantity: r.quantity ?? 0,
    }));
    
    const locationRecords = records.map((r) => ({
      ...r,
      location_quantity: r.quantity ?? 0,
    }));
    
    // Step 4: Deduplicate by composite keys (warehouse_id + batch_id, etc.)
    const dedupedWarehouseRecords = deduplicateByCompositeKey(
      warehouseRecords,
      ['warehouse_id', 'batch_id'],
      (a, b) => {
        a.warehouse_quantity += b.warehouse_quantity ?? 0;
      }
    );
    
    const dedupedLocationRecords = deduplicateByCompositeKey(
      locationRecords,
      ['location_id', 'batch_id'],
      (a, b) => {
        a.location_quantity += b.location_quantity ?? 0;
      }
    );
    
    return { dedupedWarehouseRecords, dedupedLocationRecords };
  } catch (error) {
    logSystemException(error, 'Failed to validate and normalize inventory records.', {
      context: 'inventory-business/validateAndNormalizeInventoryRecords',
      recordCount: records?.length,
    });
    throw AppError.businessError('Inventory validation or normalization failed.');
  }
};

/**
 * Enriches inventory input records with inserted inventory IDs and log metadata
 * for building inventory activity log entries.
 *
 * Responsibilities:
 * - Attaches `warehouse_inventory_id` and `location_inventory_id` by matching composite keys.
 * - Injects system-level metadata fields needed for audit logging:
 *     - `status_id`, `inventory_action_type_id`, `adjustment_type_id`, `source_type`
 *     - `user_id` to reflect the actor performing the operation
 *
 * @param {Object} params
 * @param {Array<Object>} params.originalRecords - Raw input inventory records (before insertion)
 * @param {Map<string, string>} params.warehouseMap - Map of `warehouse_id::batch_id` → inserted `warehouse_inventory_id`
 * @param {Map<string, string>} params.locationMap - Map of `location_id::batch_id` → inserted `location_inventory_id`
 * @param {string} params.user_id - Authenticated user performing the operation
 *
 * @returns {Array<Object>} Enriched records suitable for log construction
 */
const buildEnrichedRecordsForLog = ({
                                      originalRecords,
                                      warehouseMap,
                                      locationMap,
                                      user_id,
                                    }) =>
  originalRecords.map((r) => ({
    ...r,
    
    // Link to newly inserted inventory records
    warehouse_inventory_id: warehouseMap.get(`${r.warehouse_id}::${r.batch_id}`) ?? null,
    location_inventory_id: locationMap.get(`${r.location_id}::${r.batch_id}`) ?? null,
    
    // Default metadata for inventory creation logs
    status_id: getStatusId('inventory_in_stock'),
    inventory_action_type_id: getStatusId('action_manual_stock_insert'),
    adjustment_type_id: getStatusId('adjustment_manual_stock_insert'),
    source_type: InventorySourceTypes.MANUAL_INSERT,
    
    // Audit actor
    user_id,
  }));

/**
 * Validates and normalizes inventory adjustment records, then computes
 * the resulting quantity changes and corresponding audit log records.
 *
 * Responsibilities:
 * - Validates input format and record count using `validateAndNormalizeInventoryRecords`
 * - Deduplicates records and normalizes quantity values
 * - Delegates core quantity computation and status tracking to `computeInventoryAdjustmentsCore`
 *
 * @param {Array<Object>} records - Raw inventory adjustment records
 *   Each record may include:
 *     - `warehouse_id`, `location_id`, `batch_id`
 *     - `quantity`, `inventory_action_type_id`, `adjustment_type_id`, `comments`, `meta`
 *
 * @param {import('pg').PoolClient} client - PostgreSQL client within transaction scope
 *
 * @returns {Promise<{
 *   warehouseInventoryUpdates: Object,
 *   locationInventoryUpdates: Object,
 *   warehouseCompositeKeys: Array<Object>,
 *   locationCompositeKeys: Array<Object>,
 *   logRecords: Array<Object>
 * }>}
 *
 * @throws {AppError} If validation fails or unexpected system error occurs
 */
const computeInventoryAdjustments = async (records, client) => {
  try {
    // Step 1: Validate and normalize input (quantity defaults, deduplication)
    const { dedupedWarehouseRecords, dedupedLocationRecords } =
      await validateAndNormalizeInventoryRecords(records, client);
    
    // Step 2: Combine normalized records for core adjustment computation
    const updates = [...dedupedWarehouseRecords, ...dedupedLocationRecords];
    
    // Step 3: Compute final update payloads, status updates, and log entries
    return await computeInventoryAdjustmentsCore(updates, client);
  } catch (error) {
    logSystemException(error, 'Failed to compute inventory adjustments.', {
      context: 'inventory-business/computeInventoryAdjustments',
      recordCount: records?.length,
    });
    throw AppError.businessError('Failed to compute inventory adjustments.');
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
  validateAndNormalizeInventoryRecords,
  buildEnrichedRecordsForLog,
  computeInventoryAdjustments,
};

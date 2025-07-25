const { getStatusId } = require('../config/status-cache');
const {
  getWarehouseInventoryQuantities,
} = require('../repositories/warehouse-inventory-repository');
const AppError = require('../utils/AppError');
const {
  InventorySourceTypes,
} = require('../utils/constants/domain/inventory-source-types');
const {
  getLocationInventoryQuantities,
} = require('../repositories/location-inventory-repository');
const { logSystemException } = require('../utils/system-logger');
const { validateBatchRegistryEntryById } = require('./batch-registry-business');
const { deduplicateByCompositeKey } = require('../utils/array-utils');
const { mergeInventoryFields } = require('./utils/merge-inventory-fields');
const processInventoryUpdate = require('./utils/process-inventory-update');

const MAX_BULK_RECORDS = 20;

/**
 * Validates and normalizes inventory input records before insertion or adjustment.
 *
 * Responsibilities:
 * - Ensures input is a non-empty array and within allowed bulk size.
 * - Validates batch registry references using `batch_type` and `batch_id`.
 * - Normalizes input into unified records with `quantity`, `warehouse_quantity`, `location_quantity`, and `meta`.
 * - Deduplicates records by composite key (`warehouse_id` + `location_id` + `batch_id`) using `mergeInventoryFields`.
 * - Splits deduplicated results back into warehouse and location groups for separate processing.
 *
 * @param {Array<Object>} records - Raw inventory records from the request payload.
 * @param {import('pg').PoolClient} client - PostgreSQL client within a transaction context.
 *
 * @returns {Promise<{ dedupedWarehouseRecords: Array<Object>, dedupedLocationRecords: Array<Object> }>}
 *   Object containing deduplicated warehouse and location records.
 *
 * @throws {AppError} If input validation fails or any system error occurs during normalization.
 */
const validateAndNormalizeInventoryRecords = async (records, client) => {
  try {
    // Step 1: Validate input type and size
    if (!Array.isArray(records) || records.length === 0) {
      throw AppError.validationError('No inventory records provided.');
    }
    if (records.length > MAX_BULK_RECORDS) {
      throw AppError.validationError(
        `Bulk limit is ${MAX_BULK_RECORDS} records.`
      );
    }

    // Step 2: Validate batch registry existence
    await Promise.all(
      records.map((r) =>
        validateBatchRegistryEntryById(r.batch_type, r.batch_id, client)
      )
    );

    // Step 3: Normalize quantities into a unified record
    const normalizedRecords = records.map((r) => ({
      ...r,
      quantity: r.quantity ?? 0,
      warehouse_quantity: r.quantity ?? 0,
      location_quantity: r.quantity ?? 0,
      meta: r.meta ?? {},
    }));

    // Step 4: Deduplicate globally across warehouse_id + location_id + batch_id
    const dedupedRecords = deduplicateByCompositeKey(
      normalizedRecords,
      ['warehouse_id', 'location_id', 'batch_id'],
      mergeInventoryFields
    );

    // Step 5: Split back into two target groups
    const dedupedWarehouseRecords = dedupedRecords.filter(
      (r) => r.warehouse_id
    );
    const dedupedLocationRecords = dedupedRecords.filter((r) => r.location_id);

    return { dedupedWarehouseRecords, dedupedLocationRecords };
  } catch (error) {
    logSystemException(
      error,
      'Failed to validate and normalize inventory records.',
      {
        context: 'inventory-business/validateAndNormalizeInventoryRecords',
        recordCount: records?.length,
      }
    );
    throw AppError.businessError(
      'Inventory validation or normalization failed.'
    );
  }
};

/**
 * Enriches normalized inventory records with inserted inventory IDs and metadata
 * required to construct inventory activity logs.
 *
 * Responsibilities:
 * - Attaches `warehouse_inventory_id` or `location_inventory_id` by resolving composite keys.
 * - Uses `record_scope` to determine whether the record applies to warehouse or location inventory.
 * - Injects log metadata:
 *   - `status_id`, `inventory_action_type_id`, `adjustment_type_id`, `source_type`
 *   - `user_id` for auditing who performed the operation
 *
 * Requirements:
 * - Each input record must include `record_scope` set to either `'warehouse'` or `'location'`.
 * - Composite keys (`warehouse_id::batch_id` or `location_id::batch_id`) must match the provided maps.
 *
 * @param {Object} params
 * @param {Array<Object>} params.originalRecords - Deduplicated inventory records tagged with `record_scope`.
 * @param {Map<string, string>} params.warehouseMap - Map of `warehouse_id::batch_id` → inserted `warehouse_inventory_id`.
 * @param {Map<string, string>} params.locationMap - Map of `location_id::batch_id` → inserted `location_inventory_id`.
 * @param {string} params.user_id - ID of the user who initiated the inventory change.
 *
 * @returns {Array<Object>} Records enriched with inventory references and logging metadata.
 *
 * @throws {Error} If `record_scope` is missing or invalid for any record.
 */
const buildEnrichedRecordsForLog = ({
  originalRecords,
  warehouseMap,
  locationMap,
  user_id,
}) =>
  originalRecords.map((r) => {
    const isWarehouse = r.record_scope === 'warehouse';
    const isLocation = r.record_scope === 'location';

    return {
      ...r,

      // Attach correct inventory ID
      warehouse_inventory_id: isWarehouse
        ? (warehouseMap.get(`${r.warehouse_id}::${r.batch_id}`) ?? null)
        : null,
      location_inventory_id: isLocation
        ? (locationMap.get(`${r.location_id}::${r.batch_id}`) ?? null)
        : null,

      // Identify scope
      record_scope: r.record_scope, // 'warehouse' or 'location'

      // Enrich log metadata
      status_id: getStatusId('inventory_in_stock'),
      inventory_action_type_id: getStatusId('action_manual_stock_insert'),
      adjustment_type_id: getStatusId('adjustment_manual_stock_insert'),
      source_type: InventorySourceTypes.MANUAL_INSERT,

      // Audit actor
      user_id,
    };
  });

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
 * Computes inventory updates and generates audit logs for manual quantity adjustments.
 *
 * This function:
 * - Delegates inventory record processing to `processInventoryUpdate`
 * - Validates that reserved quantities do not exceed updated quantities
 * - Applies business rules to determine status updates (in_stock or out_of_stock only if previously so)
 * - Aggregates update payloads and corresponding audit log records
 *
 * @param updates - Array of inventory adjustment inputs, each containing:
 *   - `warehouse_id`, `location_id`, `batch_id`, `quantity`
 *   - `inventory_action_type_id`, `adjustment_type_id`, `comments`
 *   - Optional `meta` and transaction `client`
 *
 * @param client - Postgres client (used within a transaction context)
 *
 * @returns {
 *   warehouseInventoryUpdates: Record<string, object>,
 *   locationInventoryUpdates: Record<string, object>,
 *   warehouseCompositeKeys: Array<{ warehouse_id: string, batch_id: string }>,
 *   locationCompositeKeys: Array<{ location_id: string, batch_id: string }>,
 *   logRecords: Array<object>
 * }
 *
 * @throws AppError if any inventory record is not found or reserved quantity exceeds target
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

    const seenWarehouseKeys = new Set();
    const seenLocationKeys = new Set();

    for (const update of updates) {
      const sharedParams = {
        update: { ...update, client },
        inStockId,
        outOfStockId,
      };

      // Process warehouse update
      const warehouseLog = await processInventoryUpdate({
        ...sharedParams,
        scope: 'warehouse',
        idKey: 'warehouse_id',
        qtyKey: 'warehouse_quantity',
        fetchFn: getWarehouseInventoryQuantities,
        updatesMap: warehouseInventoryUpdates,
        compositeKeys: warehouseCompositeKeys,
        seenKeys: seenWarehouseKeys,
      });
      if (warehouseLog) logRecords.push(warehouseLog);

      // Process location update
      const locationLog = await processInventoryUpdate({
        ...sharedParams,
        scope: 'location',
        idKey: 'location_id',
        qtyKey: 'location_quantity',
        fetchFn: getLocationInventoryQuantities,
        updatesMap: locationInventoryUpdates,
        compositeKeys: locationCompositeKeys,
        seenKeys: seenLocationKeys,
      });
      if (locationLog) logRecords.push(locationLog);
    }

    return {
      warehouseInventoryUpdates,
      locationInventoryUpdates,
      warehouseCompositeKeys,
      locationCompositeKeys,
      logRecords,
    };
  } catch (error) {
    const message =
      'Failed to compute inventory adjustments due to unexpected system error.';
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

const { withTransaction, lockRows } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');
const {
  insertWarehouseInventoryRecords,
  getWarehouseInventoryResponseByIds,
} = require('../repositories/warehouse-inventory-repository');
const {
  insertLocationInventoryRecords,
  getLocationInventoryResponseByIds,
  bulkUpdateLocationQuantities,
} = require('../repositories/location-inventory-repository');
const { buildInventoryLogRows } = require('../utils/inventory-log-utils');
const {
  insertInventoryActivityLogs,
} = require('../repositories/inventory-log-repository');
const {
  transformWarehouseInventoryResponseRecords,
} = require('../transformers/warehouse-inventory-transformer');
const {
  transformLocationInventoryResponseRecords,
} = require('../transformers/location-inventory-transformer');
const {
  computeInventoryAdjustments,
  buildEnrichedRecordsForLog,
  validateAndNormalizeInventoryRecords,
} = require('../business/inventory-business');
const {
  bulkUpdateWarehouseQuantities,
} = require('../repositories/warehouse-inventory-repository');

/**
 * Creates both warehouse and location inventory records and logs activity in a transaction.
 *
 * Responsibilities:
 * - Validates batch references before inserting (ensures foreign keys are correct).
 * - Deduplicates and normalizes warehouse/location records by composite keys.
 * - Merges quantities, latest `inbound_date`, concatenated `comments`, and shallow metadata.
 * - Inserts deduplicated records into `warehouse_inventory` and `location_inventory`.
 * - Maps inserted inventory IDs back to the original input using composite keys.
 * - Enriches log records with inventory references, scope (`warehouse` or `location`), and user context.
 * - Logs activity into `inventory_activity_log` (and optionally `inventory_activity_audit_log`).
 * - Returns enriched inserted records for client consumption.
 *
 * @param {Array<Object>} records - Raw inventory input records from the request.
 *   Each record should contain:
 *     - `batch_id`: UUID of the batch.
 *     - `batch_type`: e.g., 'product' or 'packaging_material'.
 *     - `warehouse_id`: UUID of the target warehouse.
 *     - `location_id`: UUID of the physical location.
 *     - `quantity`: Quantity to insert (defaulted to 0 if not provided).
 *     - (optional) `inbound_date`, `comments`, `meta`, etc.
 *
 * @param {string} user_id - ID of the authenticated user performing the insert action.
 *
 * @returns {Promise<{ warehouse: Array<Object>, location: Array<Object> }>}
 *   An object containing:
 *     - `warehouse`: Transformed warehouse inventory records with metadata.
 *     - `location`: Transformed location inventory records with metadata.
 *
 * Notes:
 * - Each log entry is explicitly tagged with a `record_scope` (`warehouse` or `location`) to
 *   enable downstream filtering and UI-level deduplication where applicable.
 *
 * @throws {AppError} If validation fails or any DB operation encounters an error.
 */
const createInventoryRecordService = async (records, user_id) => {
  try {
    return await withTransaction(async (client) => {
      // Step 1: Validate, normalize, and deduplicate input records
      const { dedupedWarehouseRecords, dedupedLocationRecords } =
        await validateAndNormalizeInventoryRecords(records, client);

      // Step 2: Insert into warehouse and location inventory tables
      const insertedWarehouseRecords = await insertWarehouseInventoryRecords(
        dedupedWarehouseRecords,
        client
      );
      const insertedLocationRecords = await insertLocationInventoryRecords(
        dedupedLocationRecords,
        client
      );

      // Step 3: Build mappings from a composite key → inserted inventory IDs
      const warehouseMap = new Map();
      dedupedWarehouseRecords.forEach((r, i) =>
        warehouseMap.set(
          `${r.warehouse_id}::${r.batch_id}`,
          insertedWarehouseRecords[i].warehouse_inventory_id
        )
      );

      const locationMap = new Map();
      dedupedLocationRecords.forEach((r, i) =>
        locationMap.set(
          `${r.location_id}::${r.batch_id}`,
          insertedLocationRecords[i].location_inventory_id
        )
      );

      // Step 4: Enrich logs with inventory IDs and user context
      const enrichedForLog = buildEnrichedRecordsForLog({
        originalRecords: [
          ...dedupedWarehouseRecords.map((r) => ({
            ...r,
            record_scope: 'warehouse',
          })),
          ...dedupedLocationRecords.map((r) => ({
            ...r,
            record_scope: 'location',
          })),
        ],
        warehouseMap,
        locationMap,
        user_id,
      });

      // Step 5: Build and insert log rows
      const logRows = buildInventoryLogRows(enrichedForLog);
      await insertInventoryActivityLogs(logRows, client);

      // Step 6: Fetch full enriched inventory rows to return
      const [warehouseRaw, locationRaw] = await Promise.all([
        getWarehouseInventoryResponseByIds(
          insertedWarehouseRecords.map((r) => r.warehouse_inventory_id),
          client
        ),
        getLocationInventoryResponseByIds(
          insertedLocationRecords.map((r) => r.location_inventory_id),
          client
        ),
      ]);

      // Step 7: Transform and return for client response
      return {
        warehouse: transformWarehouseInventoryResponseRecords(warehouseRaw),
        location: transformLocationInventoryResponseRecords(locationRaw),
      };
    });
  } catch (error) {
    logSystemException(error, 'createInventoryRecordService failed', {
      context: 'inventory-service/createInventoryRecordService',
      recordCount: records?.length,
    });
    throw AppError.serviceError('Failed to create inventory records.', {
      details: { count: records?.length, error: error.message },
    });
  }
};

/**
 * Adjusts warehouse and location inventory quantities in a transactional and auditable manner.
 *
 * Responsibilities:
 * - Validates and normalizes updates using `computeInventoryAdjustments`.
 * - Optionally locks inventory rows with `FOR UPDATE` to prevent race conditions.
 * - Performs bulk updates to `warehouse_inventory` and `location_inventory`.
 * - Enriches log records with user context.
 * - Inserts audit logs into `inventory_activity_log` and/or `inventory_activity_audit_log`.
 *
 * @param {Array<Object>} updates - Array of inventory adjustment records.
 *   Each record may include:
 *     - `warehouse_id`, `location_id`, `batch_id`
 *     - `warehouse_quantity`, `location_quantity`
 *     - `inventory_action_type_id`, `adjustment_type_id`
 *     - `comments`, `meta` (optional)
 *
 * @param {string} user_id - The authenticated user performing the adjustment.
 * @param {boolean} [lockBeforeUpdate=true] - Whether to lock rows using `FOR UPDATE` before modifying them.
 *
 * @returns {Promise<{ warehouse: Array<Object>, location: Array<Object> }>}
 *   An object containing:
 *     - `warehouse`: Updated warehouse inventory rows
 *     - `location`: Updated location inventory rows
 *
 * @throws {AppError} If inventory validation fails or DB operations encounter issues.
 */
const adjustInventoryQuantitiesService = async (
  updates,
  user_id,
  lockBeforeUpdate = true
) => {
  try {
    return await withTransaction(async (client) => {
      // Step 1: Validate updates and compute what needs to be changed
      const {
        warehouseInventoryUpdates,
        locationInventoryUpdates,
        warehouseCompositeKeys,
        locationCompositeKeys,
        logRecords,
      } = await computeInventoryAdjustments(updates, client);

      // Step 2: Lock inventory rows to prevent concurrent updates (optional)
      if (lockBeforeUpdate) {
        if (warehouseCompositeKeys.length > 0) {
          await lockRows(
            client,
            'warehouse_inventory',
            warehouseCompositeKeys,
            'FOR UPDATE',
            {
              purpose: 'Adjusting warehouse inventory quantities',
            }
          );
        }
        if (locationCompositeKeys.length > 0) {
          await lockRows(
            client,
            'location_inventory',
            locationCompositeKeys,
            'FOR UPDATE',
            {
              purpose: 'Adjusting location inventory quantities',
            }
          );
        }
      }

      // Step 3: Apply inventory quantity updates
      const [updatedWarehouseIds, updatedLocationIds] = await Promise.all([
        bulkUpdateWarehouseQuantities(
          warehouseInventoryUpdates,
          user_id,
          client
        ),
        bulkUpdateLocationQuantities(locationInventoryUpdates, user_id, client),
      ]);

      // Step 4: Enrich log records with user context
      const enrichedLogs = logRecords.map((log) => ({
        ...log,
        user_id,
      }));

      // Step 5: Insert inventory activity logs
      await insertInventoryActivityLogs(
        buildInventoryLogRows(enrichedLogs),
        client
      );

      // Step 6: Fetch full enriched inventory rows to return
      const [warehouseRows, locationRows] = await Promise.all([
        getWarehouseInventoryResponseByIds(
          updatedWarehouseIds.map((r) => r.id),
          client
        ),
        getLocationInventoryResponseByIds(
          updatedLocationIds.map((r) => r.id),
          client
        ),
      ]);

      // Step 7: Transform and return for client response
      return {
        warehouse: transformWarehouseInventoryResponseRecords(warehouseRows),
        location: transformLocationInventoryResponseRecords(locationRows),
      };
    });
  } catch (error) {
    logSystemException(
      error,
      'Failed to adjust inventory quantities due to unexpected system error.',
      {
        context: 'inventory-service/adjustInventoryQuantitiesService',
        updates,
      }
    );
    throw AppError.serviceError('Failed to adjust inventory quantities.');
  }
};

module.exports = {
  createInventoryRecordService,
  adjustInventoryQuantitiesService,
};

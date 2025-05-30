const { withTransaction } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');
const { validateBatchRegistryEntryById } = require('../business/batch-registry-business');
const { insertWarehouseInventoryRecords, getInsertedWarehouseInventoryByIds } = require('../repositories/warehouse-inventory-repository');
const { insertLocationInventoryRecords, getInsertedLocationInventoryByIds } = require('../repositories/location-inventory-repository');
const { buildInventoryLogRows } = require('../utils/inventory-log-utils');
const { insertInventoryActivityLogs } = require('../repositories/inventory-log-repository');
const { transformInsertedWarehouseInventoryRecords } = require('../transformers/warehouse-inventory-transformer');
const { transformInsertedLocationInventoryRecords } = require('../transformers/location-inventory-transformer');
const { getStatusId } = require('../config/status-cache');
const { deduplicateByCompositeKey } = require('../utils/array-utils');

/**
 * Creates both warehouse and location inventory records and logs activity in a transaction.
 *
 * - Validates batch references before inserting.
 * - Ensures atomicity using a transaction.
 * - Logs activity in both `inventory_activity_log` and `inventory_activity_audit_log`.
 * - Returns enriched inserted records for both warehouse and location inventory.
 *
 * @param {Array<Object>} records - Raw inventory input records.
 *   Each record should contain:
 *   - batchId, batchType, warehouse_id, location_id, quantity, status_id, created_by, inventory_action_type_id
 *
 * @returns {Promise<{ warehouse: Array<Object>, location: Array<Object> }>}
 *   Transformed enriched inventory records, grouped by scope.
 *
 * @throws {AppError} If any step fails.
 */
const createInventoryRecordService = async (records) => {
  try {
    return await withTransaction(async (client) => {
      const MAX_BULK_INSERT = 20;
      
      if (!Array.isArray(records) || records.length === 0) {
        throw AppError.validationError('No inventory records provided.');
      }
      if (records.length > MAX_BULK_INSERT) {
        throw AppError.validationError(`Bulk insert limit is ${MAX_BULK_INSERT} records.`);
      }
      
      // Step 1: Validate batch registry references
      await Promise.all(
        records.map((r) =>
          validateBatchRegistryEntryById(r.batch_type, r.batch_id, client)
        )
      );
      
      // Step 2: Normalize quantities from the input before deduplication
      const warehouseRecords = records.map((r) => ({
        ...r,
        warehouse_quantity: r.quantity ?? 0,
      }));
      const locationRecords = records.map((r) => ({
        ...r,
        location_quantity: r.quantity ?? 0,
      }));
      
      // Step 3: Deduplicate for insertion
      const dedupedWarehouseRecords = deduplicateByCompositeKey(warehouseRecords, ['warehouse_id', 'batch_id'], (a, b) => {
        a.warehouse_quantity += b.warehouse_quantity ?? 0;
      });
      const dedupedLocationRecords = deduplicateByCompositeKey(locationRecords, ['location_id', 'batch_id'], (a, b) => {
        a.location_quantity += b.location_quantity ?? 0;
      });
      
      // Step 4: Insert warehouse inventory
      const insertedWarehouseRecords = await insertWarehouseInventoryRecords(dedupedWarehouseRecords, client);
    
      // Step 5: Insert location inventory
      const insertedLocationRecords = await insertLocationInventoryRecords(dedupedLocationRecords, client);
      
      // Step 6: Map inserted IDs to original records using composite key
      const warehouseMap = new Map();
      dedupedWarehouseRecords.forEach((r, i) => {
        const key = `${r.warehouse_id}::${r.batch_id}`;
        warehouseMap.set(key, insertedWarehouseRecords[i].warehouse_inventory_id);
      });
      
      const locationMap = new Map();
      dedupedLocationRecords.forEach((r, i) => {
        const key = `${r.location_id}::${r.batch_id}`;
        locationMap.set(key, insertedLocationRecords[i].location_inventory_id);
      });
      
      // Step 7: Enrich for log building
      const enrichedRecordsForLog = records.map((r, i) => ({
        ...r,
        warehouse_inventory_id: warehouseMap.get(`${r.warehouse_id}::${r.batch_id}`) ?? null,
        location_inventory_id: locationMap.get(`${r.location_id}::${r.batch_id}`) ?? null,
        status_id: getStatusId('inventory_in_stock'),
        inventory_action_type_id: getStatusId('action_manual_stock_insert'),
        adjustment_type_id: getStatusId('adjustment_manual_stock_insert'),
      }));
      
      // Step 8: Build and insert inventory activity logs
      const logRows = buildInventoryLogRows(enrichedRecordsForLog);
      await insertInventoryActivityLogs(logRows, client);
      
      // Step 9: Fetch enriched insert result
      const warehouseEnrichedRaw = await getInsertedWarehouseInventoryByIds(
        insertedWarehouseRecords.map((row) => row.warehouse_inventory_id),
        client
      );
      
      const locationEnrichedRaw = await getInsertedLocationInventoryByIds(
        insertedLocationRecords.map((row) => row.location_inventory_id),
        client
      );
      
      return {
        warehouse: transformInsertedWarehouseInventoryRecords(warehouseEnrichedRaw),
        location: transformInsertedLocationInventoryRecords(locationEnrichedRaw),
      };
    });
  } catch (error) {
    logSystemException(error, 'createInventoryRecordService failed', {
      context: 'warehouse-inventory-service/createInventoryRecordService',
      recordCount: records?.length,
    });
    
    throw AppError.serviceError('Failed to create inventory records', {
      details: { count: records?.length, error: error.message },
    });
  }
};

module.exports = {
  createInventoryRecordService,
};

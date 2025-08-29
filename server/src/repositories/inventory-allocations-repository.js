const { bulkInsert } = require('../database/db');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Bulk inserts inventory allocation records into the `inventory_allocations` table.
 *
 * This function transforms a list of allocation objects into a tabular row format
 * and performs a batched insert using a shared `bulkInsert` utility. It supports
 * conflict resolution based on specified unique keys and applies update strategies
 * (e.g., overwriting or updating timestamps).
 *
 * @param {Array<Object>} allocations - List of allocation objects, where each item includes:
 *   - {string} order_item_id
 *   - {string|null} transfer_order_item_id
 *   - {string} warehouse_id
 *   - {string} batch_id
 *   - {number} allocated_quantity
 *   - {string} status_id
 *   - {string|Date|null} allocated_at
 *   - {string|null} created_by
 *   - {string|null} updated_by
 *   - {string|Date|null} updated_at
 *
 * @param {import('pg').PoolClient} client - PG client instance for transactional execution.
 *
 * @returns {Promise<Array>} - Result of the `bulkInsert` operation (inserted/updated rows).
 *
 * @throws {AppError} - Throws a database error if the insert fails.
 *
 * @example
 * await insertInventoryAllocationsBulk([
 *   {
 *     order_item_id: 'abc-123',
 *     transfer_order_item_id: null,
 *     warehouse_id: 'wh-001',
 *     batch_id: 'batch-456',
 *     allocated_quantity: 10,
 *     status_id: 'allocated',
 *     allocated_at: new Date(),
 *     created_by: 'user-001',
 *     updated_by: 'user-001',
 *     updated_at: new Date()
 *   }
 * ], dbClient);
 */
const insertInventoryAllocationsBulk = async (allocations, client) => {
  const rows = allocations.map((item) => [
    item.order_item_id ?? null,
    item.transfer_order_item_id ?? null,
    item.warehouse_id,
    item.batch_id,
    item.allocated_quantity,
    item.status_id,
    item.allocated_at ?? null,
    item.created_by ?? null,
    item.updated_by ?? null,
    item.updated_at ?? null,
  ]);
  
  const columns = [
    'order_item_id',
    'transfer_order_item_id',
    'warehouse_id',
    'batch_id',
    'allocated_quantity',
    'status_id',
    'allocated_at',
    'created_by',
    'updated_by',
    'updated_at',
  ];
  
  const conflictColumns = ['target_item_id', 'batch_id', 'warehouse_id'];
  
  const updateStrategies = {
    allocated_quantity: 'overwrite',
    status_id: 'overwrite',
    allocated_at: 'now',
    updated_by: 'overwrite',
    updated_at: 'now',
  };
  
  try {
   return await bulkInsert(
      'inventory_allocations',
      columns,
      rows,
      conflictColumns,
      updateStrategies,
      client,
      { context: 'inventory-allocation-repository/insertInventoryAllocationsBulk' }
    );
  } catch (error) {
    logSystemException(error, 'Failed to bulk insert inventory allocations', {
      context: 'inventory-allocation-repository/insertInventoryAllocationsBulk',
      data: allocations,
    });
    
    throw AppError.databaseError('Unable to insert inventory allocations in bulk.');
  }
};

module.exports = {
  insertInventoryAllocationsBulk,
};

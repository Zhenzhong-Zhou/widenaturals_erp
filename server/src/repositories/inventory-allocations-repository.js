const { query, bulkInsert } = require('../database/db');
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

/**
 * Fetches all inventory allocation records for a given order.
 *
 * @param {string} orderId - The UUID of the order to fetch allocations for.
 * @param {object} client - Optional PostgreSQL client used in transaction context.
 * @returns {Promise<Array<{ id: string, order_id: string, allocated_quantity: number, status_id: string, status_code: string }>>}
 *          A list of allocation records with status codes.
 * @throws {AppError} If the query fails.
 */
const getAllocationsByOrderId = async (orderId, client) => {
  const sql = `
    SELECT
      ia.id,
      ia.order_id,
      ia.allocated_quantity,
      ia.status_id,
      ias.code AS status_code
    FROM inventory_allocations ia
    JOIN inventory_allocation_status ias ON ia.status_id = ias.id
    WHERE ia.order_id = $1
  `;

  try {
    const result = await query(sql, [orderId], client);
    return result.rows || [];
  } catch (error) {
    logError('Error fetching allocations:', error);
    throw AppError.databaseError(
      'Failed to fetch allocations: ' + error.message
    );
  }
};

/**
 * Fetches the total allocated quantity for a specific inventory item in a given order.
 * This ensures the allocation does not exceed the ordered quantity.
 *
 * @param {Object} params - Parameters object.
 * @param {string} params.orderId - The ID of the order.
 * @param {string} params.inventoryId - The ID of the inventory item.
 * @param {Object} client - The database client or transaction client.
 * @returns {Promise<number>} - The total quantity allocated so far for the given inventory in the order.
 *
 * @throws {AppError} - If the database query fails.
 */
const getTotalAllocatedForOrderItem = async (
  { orderId, inventoryId },
  client
) => {
  try {
    const sql = `
      SELECT COALESCE(SUM(allocated_quantity), 0) AS total_allocated
      FROM inventory_allocations ia
      JOIN inventory i ON ia.inventory_id = i.id
      WHERE ia.order_id = $1 AND i.id = $2;
    `;

    const { rows } = await query(sql, [orderId, inventoryId], client);
    return Number(rows[0]?.total_allocated ?? 0);
  } catch (error) {
    logError('Error in getTotalAllocatedForOrderItem:', error);
    throw AppError.databaseError(
      'Failed to fetch allocated quantity for order item'
    );
  }
};

module.exports = {
  insertInventoryAllocationsBulk,
  getAllocationsByOrderId,
  getTotalAllocatedForOrderItem,
};

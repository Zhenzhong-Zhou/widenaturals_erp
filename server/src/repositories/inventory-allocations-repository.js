const { query } = require('../database/db');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Inserts a new inventory allocation record into the database.
 *
 * @param {Object} allocation - The allocation data to insert.
 * @param {string} allocation.inventory_id - The ID of the inventory record.
 * @param {string} allocation.warehouse_id - The ID of the warehouse.
 * @param {string} [allocation.lot_id] - Optional ID of the warehouse lot.
 * @param {number} allocation.allocated_quantity - The quantity being allocated.
 * @param {string} allocation.status_id - The current status ID of the allocation.
 * @param {string} [allocation.order_id] - Optional ID of the sales order linked to this allocation.
 * @param {string} [allocation.transfer_id] - Optional ID of the inventory transfer.
 * @param {string} [allocation.created_by] - ID of the user who created the allocation.
 * @param {string} [allocation.updated_by] - ID of the user who last updated the allocation.
 * @param {import('pg').PoolClient} [client] - Optional PostgreSQL client for transactional execution.
 * @returns {Promise<Object>} - The inserted inventory allocation record.
 * @throws {Error} - Throws if the query fails.
 */
const insertInventoryAllocation = async ({
                                           inventory_id,
                                           warehouse_id,
                                           lot_id = null,
                                           allocated_quantity,
                                           status_id,
                                           order_id = null,
                                           transfer_id = null,
                                           created_by = null,
                                           updated_by = null,
                                         }, client) => {
  if (!inventory_id || !warehouse_id || !allocated_quantity || !status_id) {
    throw AppError.validationError('Missing required fields for inventory allocation.');
  }
  
  if (allocated_quantity <= 0) {
    throw AppError.validationError('Allocated quantity must be a positive number.');
  }
  
  const sql = `
    INSERT INTO inventory_allocations (
      inventory_id,
      warehouse_id,
      lot_id,
      allocated_quantity,
      status_id,
      allocated_at,
      order_id,
      transfer_id,
      created_by,
      updated_by,
      created_at,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, NOW(),
      $6, $7, $8, NULL, NOW(), NULL
    )
    ON CONFLICT (order_id, lot_id, inventory_id, warehouse_id)
    DO UPDATE SET
      allocated_quantity = inventory_allocations.allocated_quantity + EXCLUDED.allocated_quantity,
      updated_at = NOW(),
      updated_by = EXCLUDED.created_by
    RETURNING *;
  `;
  
  const values = [
    inventory_id,
    warehouse_id,
    lot_id,
    allocated_quantity,
    status_id,
    order_id,
    transfer_id,
    created_by,
  ];
  
  const result = await query(sql, values, client);
  return result.rows[0];
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
    throw AppError.databaseError('Failed to fetch allocations: ' + error.message);
  }
};

/**
 * Fetches the total allocated quantity for a specific product in a given order.
 * This helps ensure that the allocation does not exceed the ordered quantity.
 *
 * @param {Object} params
 * @param {string} params.orderId - The ID of the order.
 * @param {string} params.productId - The ID of the product.
 * @param {Object} client - The database client or transaction client.
 * @returns {Promise<number>} - The total quantity allocated so far for the given product in the order.
 *
 * @throws {AppError} - If the database query fails.
 */
const getTotalAllocatedForOrderItem = async ({ orderId, productId }, client) => {
  try {
    const sql = `
      SELECT COALESCE(SUM(allocated_quantity), 0) AS total_allocated
      FROM inventory_allocations ia
      JOIN inventory i ON ia.inventory_id = i.id
      WHERE ia.order_id = $1 AND i.product_id = $2
    `;
    
    const { rows } = await query(sql, [orderId, productId], client);
    return Number(rows[0]?.total_allocated ?? 0);
  } catch (error) {
    logError('Error in getTotalAllocatedForOrderItem:', error);
    throw AppError.databaseError('Failed to fetch allocated quantity for order item');
  }
};

module.exports = {
  insertInventoryAllocation,
  getAllocationsByOrderId,
  getTotalAllocatedForOrderItem,
};

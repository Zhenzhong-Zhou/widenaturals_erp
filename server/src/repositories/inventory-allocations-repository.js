const { query } = require('../database/db');

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
 *
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
                                         }) => {
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
      $6, $7, $8, $9, NOW(), NULL
    )
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
    updated_by,
  ];
  
  const result = await query(sql, values);
  return result.rows[0];
};

module.exports = {
  insertInventoryAllocation,
};

const { query } = require('../database/db');

/**
 * Inserts a new inventory allocation record.
 * @param allocation - Allocation input values
 */
const insertInventoryAllocation = async (allocation: {
  inventory_id,
  warehouse_id,
  lot_id,
  allocated_quantity,
  status_id,
  order_id,
  transfer_id,
  created_by,
  updated_by,
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
    allocation.inventory_id,
    allocation.warehouse_id,
    allocation.lot_id || null,
    allocation.allocated_quantity,
    allocation.status_id,
    allocation.order_id || null,
    allocation.transfer_id || null,
    allocation.created_by || null,
    allocation.updated_by || null,
  ];
  
  const result = await query(sql, values);
  return result.rows[0];
};

module.exports = {
  insertInventoryAllocation,
};

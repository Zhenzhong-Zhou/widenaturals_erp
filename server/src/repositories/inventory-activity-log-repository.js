const { query, withTransaction } = require('../database/db');
const { insertWarehouseLotAdjustment } = require('./warehouse-lot-adjustment-repository');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Inserts an inventory activity log entry
 */
const insertInventoryActivityLog = async (
  client,
  inventory_id,
  warehouse_id,
  lot_id,
  inventory_action_type_id,
  previous_quantity,
  adjusted_quantity,
  new_quantity,
  adjustment_type_id,
  order_id,
  user_id,
  comments
) => {
  const text = `
    INSERT INTO inventory_activity_log (
      inventory_id, warehouse_id, lot_id, inventory_action_type_id,
      previous_quantity, quantity_change, new_quantity, adjustment_type_id,
      order_id, user_id, timestamp, comments
    )
    VALUES (
     $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11
    )
    RETURNING *;
  `;
  
  const values = [
    inventory_id, warehouse_id, lot_id, inventory_action_type_id,
    previous_quantity, adjusted_quantity, new_quantity, adjustment_type_id,
    order_id || null, user_id, comments
  ];
  
  try {
    const { rows } = await query(text, values, client);
    return rows[0]; // Return inserted record
  } catch (error) {
    logError("Error inserting inventory activity log:", error.message);
    throw error;
  }
};

module.exports = {
  insertInventoryActivityLog,
};

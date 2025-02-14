const crypto = require('crypto');
const { query } = require('../database/db');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

const generateChecksum = (
  inventory_id,
  inventory_action_type_id,
  previous_quantity,
  quantity_change,
  new_quantity,
  source_action_id,
  comments
) => {
  const data = [
    inventory_id,
    inventory_action_type_id,
    previous_quantity,
    quantity_change,
    new_quantity,
    source_action_id || '',
    comments || '',
    new Date().toISOString(), // Ensures uniqueness
  ].join('|');

  return crypto.createHash('md5').update(data).digest('hex');
};

/**
 * Inserts a record into the inventory history log.
 * @param {Object} client - The database client (optional, for transactions).
 * @param {string} inventory_id - The inventory record ID.
 * @param {string} inventory_action_type_id - The action type ID (e.g., 'manual_adjustment', 'restock').
 * @param {number} previous_quantity - The previous quantity before adjustment.
 * @param {number} quantity_change - The change in quantity (+ or -).
 * @param {number} new_quantity - The new quantity after adjustment.
 * @param {string} user_id - The user who performed the action.
 * @param {string|null} comments - Optional comments for the adjustment.
 * @returns {Promise<Object>} - The inserted inventory history record.
 */
const insertInventoryHistoryLog = async (
  client,
  inventory_id,
  inventory_action_type_id,
  previous_quantity,
  quantity_change,
  new_quantity,
  user_id,
  comments = null
) => {
  const checksum = generateChecksum(
    inventory_id,
    inventory_action_type_id,
    previous_quantity,
    quantity_change,
    new_quantity,
    user_id,
    comments
  );

  const queryText = `
    INSERT INTO inventory_history (
      inventory_id, inventory_action_type_id, previous_quantity, quantity_change,
      new_quantity, status_id, status_date, source_action_id, comments, checksum, metadata,
      created_at, created_by
    )
    VALUES (
      $1, $2, $3, $4, $5,
      (SELECT id FROM status WHERE name = 'active' LIMIT 1),
      NOW(), $6, $7, $8, '{}'::jsonb, NOW(), $6
    )
    RETURNING *;
  `;

  const values = [
    inventory_id, // $1
    inventory_action_type_id, // $2
    previous_quantity, // $3
    quantity_change, // $4
    new_quantity, // $5
    user_id, // $6  -> Created By & Source Action ID
    comments || null, // $7  -> Optional comments (ensure nullable)
    checksum,
  ];

  try {
    const { rows } = await query(queryText, values, client);
    return rows[0];
  } catch (error) {
    logError('Error inserting inventory history log:', error);
    throw new AppError(
      'Database error: Failed to insert inventory history log.'
    );
  }
};

module.exports = {
  generateChecksum,
  insertInventoryHistoryLog,
};

const { query } = require('../database/db');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Inserts a warehouse lot adjustment record.
 * @param {Object} client - The database client (optional, for transactions).
 * @param {string} warehouse_id - The ID of the warehouse.
 * @param {string} product_id - The ID of the product.
 * @param {string} lot_number - The lot number.
 * @param {string} adjustment_type_id - The type of adjustment (e.g., 'damaged', 'lost').
 * @param {number} previous_quantity - The previous quantity before adjustment.
 * @param {number} adjusted_quantity - The quantity change (+ or -).
 * @param {number} new_quantity - The new calculated quantity.
 * @param {string} adjusted_by - The user ID who made the adjustment.
 * @returns {Promise<Object>} - The inserted adjustment record.
 */
const insertWarehouseLotAdjustment = async (
  client,
  warehouse_id,
  product_id,
  lot_number,
  adjustment_type_id,
  previous_quantity,
  adjusted_quantity,
  new_quantity,
  adjusted_by
) => {
  const queryText = `
    INSERT INTO warehouse_lot_adjustments (
     warehouse_id, product_id, lot_number,
     adjustment_type_id, previous_quantity,
     adjusted_quantity, new_quantity, adjustment_date, adjusted_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
    RETURNING *;
  `;

  const values = [
    warehouse_id,
    product_id,
    lot_number,
    adjustment_type_id,
    previous_quantity,
    adjusted_quantity,
    new_quantity,
    adjusted_by,
  ];

  try {
    // Use the query function instead of pool.query
    const { rows } = await query(queryText, values, client);
    return rows[0]; // Return the inserted adjustment record
  } catch (error) {
    logError('Error inserting warehouse lot adjustment:', error);
    throw new AppError(
      'Database error: Failed to insert warehouse lot adjustment.'
    );
  }
};

module.exports = { insertWarehouseLotAdjustment };

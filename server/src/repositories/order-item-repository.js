const { bulkInsert } = require('../database/db');
const AppError = require('../utils/AppError');

/**
 * Adds items to an order.
 * Supports bulk insert with conflict handling.
 * Uses a transaction client if provided.
 *
 * @param {UUID} orderId - The ID of the order.
 * @param {Array} items - The list of order items.
 * @param {UUID} createdBy - User who created the order.
 * @param {Object} client - Optional transaction client.
 * @returns {Promise<Array>} - The inserted order items.
 */
const addOrderItems = async (orderId, items, createdBy, client) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw AppError.validationError('Order items cannot be empty.');
  }
  
  const columns = [
    'order_id',
    'product_id',
    'quantity_ordered',
    'price_id',
    'price',
    'status_id',
    'status_date',
    'created_by',
    'updated_by',
  ];
  
  // Ensure data is structured as an array of arrays for bulkInsert
  const rows = items.map((item) => [
    orderId, // Ensure order_id is correctly set
    item.product_id,
    item.quantity_ordered,
    item.price_id,
    item.price,
    item.status_id,
    new Date(), // Default to now if missing
    createdBy, // Created by extracted from the user session
    null,
  ]);
  
  return bulkInsert(
    'order_items',
    columns,
    rows,
    ['order_id', 'product_id', 'price_id'],
    ['quantity_ordered', 'price', 'status_id', 'updated_by', 'status_date'],
    client
  );
};

module.exports = { addOrderItems };

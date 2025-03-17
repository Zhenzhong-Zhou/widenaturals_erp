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

// Step 1: Aggregate items that have the same `product_id`, `price_type_id`, `price_id`, and `price`
  const itemMap = new Map();
  
  for (const item of items) {
    const { product_id, price_type_id, price_id, price, quantity_ordered } = item;
    
    // Create a unique key based on merging conditions
    const itemKey = `${product_id}_${price_type_id}_${price_id}_${price}`;
    
    if (itemMap.has(itemKey)) {
      // If same product, price_type_id, price_id, and price → Sum quantities
      const existingItem = itemMap.get(itemKey);
      existingItem.quantity_ordered += quantity_ordered;
      itemMap.set(itemKey, existingItem);
    } else {
      // Otherwise, store as a new line item
      itemMap.set(itemKey, {
        ...item,
        quantity_ordered,
      });
    }
  }

// Step 2: Convert aggregated items into an array for insertion
  const rows = Array.from(itemMap.values()).map((item) => [
    orderId, // Ensure order_id is correctly set
    item.product_id,
    item.quantity_ordered,
    item.price_id,
    item.price,
    item.status_id,
    new Date(), // Default to now if missing
    createdBy, // Created by extracted from the user session
    null, // No updated_by at creation
  ]);
  
  return bulkInsert(
    'order_items',
    columns,
    rows,
    ['order_id', 'product_id', 'price_id', 'price'], // Unique constraint check
    ['quantity_ordered', 'status_id', 'updated_by', 'status_date'], // Fields that can be updated
    client
  );
};

module.exports = { addOrderItems };

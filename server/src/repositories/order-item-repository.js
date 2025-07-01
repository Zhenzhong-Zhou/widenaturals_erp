const { bulkInsert } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');

/**
 * Inserts multiple order items in bulk for a given order.
 *
 * - Skips insertion if `orderItems` is empty.
 * - Automatically sets `created_at` and `updated_at` to current time.
 * - Applies conflict resolution on `(order_id, product_id, packaging_material_id)`:
 *   - `quantity_ordered` is added to existing.
 *   - `price` is overwritten.
 *   - `subtotal` is recalculated as `(EXCLUDED.price * (existing.quantity_ordered + EXCLUDED.quantity_ordered))`.
 *   - `updated_at` is overwritten.
 *
 * @param {string} orderId - The associated order ID.
 * @param {Array<Object>} orderItems - List of order items to insert. Each item must include:
 * @param {string} orderItems[].order_id - Associated order ID
 * @param {string|null} [orderItems[].sku_id] - Optional sku reference
 * @param {string|null} [orderItems[].packaging_material_id] - Optional packaging material reference
 * @param {number} orderItems[].quantity_ordered - Quantity ordered
 * @param {string|null} [orderItems[].price_id] - Optional price reference
 * @param {number|null} [orderItems[].price] - Unit price
 * @param {number} orderItems[].subtotal - Line subtotal (used or recalculated on conflict)
 * @param {string} orderItems[].status_id - Status ID
 * @param {string|Date} [orderItems[].status_date] - Optional status timestamp (default: now)
 * @param {string|null} [orderItems[].created_by] - User ID who created the record
 * @param {string|null} [orderItems[].updated_by] - User ID who last updated the record
 *
 * @param {import('pg').PoolClient} client - Active PostgreSQL transaction client
 *
 * @throws {AppError} Throws database error if insertion fails
 */
const insertOrderItemsBulk = async (orderId, orderItems, client) => {
  const now = new Date();
  
  const rows = orderItems.map((item) => [
    orderId,
    item.sku_id ?? null,
    item.packaging_material_id ?? null,
    item.quantity_ordered,
    item.price_id ?? null,
    item.price ?? null,
    item.subtotal,
    item.status_id,
    item.status_date ?? now,
    item.metadata ?? null,
    now,
    null,
    item.created_by ?? null,
    item.updated_by ?? null,
  ]);
  
  const columns = [
    'order_id',
    'sku_id',
    'packaging_material_id',
    'quantity_ordered',
    'price_id',
    'price',
    'subtotal',
    'status_id',
    'status_date',
    'metadata',
    'created_at',
    'updated_at',
    'created_by',
    'updated_by',
  ];
  
  const conflictColumns = ['order_id', 'sku_id', 'packaging_material_id'];
  
  const updateStrategies = {
    quantity_ordered: 'add',                     // adds EXCLUDED.quantity_ordered to existing data
    price: 'overwrite',                          // simply overwrites if present
    subtotal: 'recalculate_subtotal',            // subtotal already precalculated
    metadata: 'merge',
    updated_at: 'overwrite',                     // overwrites with EXCLUDED.updated_at (usually set to NOW())
  };
  
  try {
    await bulkInsert(
      'order_items',
      columns,
      rows,
      conflictColumns,
      updateStrategies,
      client,
      { context: 'order-item-repository/insertOrderItemsBulk' }
    );
  } catch (error) {
    logSystemException(error, 'Failed to bulk insert order items',{
      context: 'order-item-repository/insertOrderItemsBulk',
      data: orderItems,
    });
    
    throw AppError.databaseError('Unable to insert order items in bulk.');
  }
};

module.exports = {
  insertOrderItemsBulk,
};

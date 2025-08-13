const { bulkInsert, query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');

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
    quantity_ordered: 'add', // adds EXCLUDED.quantity_ordered to existing data
    price: 'overwrite', // simply overwrites if present
    subtotal: 'recalculate_subtotal', // subtotal already precalculated
    metadata: 'merge',
    updated_at: 'overwrite', // overwrites with EXCLUDED.updated_at (usually set to NOW())
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
    logSystemException(error, 'Failed to bulk insert order items', {
      context: 'order-item-repository/insertOrderItemsBulk',
      data: orderItems,
    });

    throw AppError.databaseError('Unable to insert order items in bulk.');
  }
};

/**
 * findOrderItemsByOrderId
 * ---------------------------------------
 * Repository: Fetch all order items for a given orderId with enriched details:
 * - Item-level status name
 * - SKU & product info (nullable if packaging_material line)
 * - Packaging material info (nullable if SKU line)
 * - Pricing info (price + price type)
 * - Audit fields with created/updated usernames
 *
 * @param {string} orderId - UUID of the order (required)
 * @returns {Promise<object[]>} Array of item rows (empty array if none found)
 * @throws {AppError} AppError.databaseError on DB failure
 */
const findOrderItemsByOrderId = async (orderId) => {
  const sql = `
    SELECT
      oi.id                     AS order_item_id,
      oi.order_id,
      oi.quantity_ordered,
      oi.price_id,
      pr.price                  AS listed_price,
      pt.name                   AS price_type_name,
      oi.price                  AS item_price,
      oi.subtotal               AS item_subtotal,
      oi.status_id              AS item_status_id,
      ios.name                  AS item_status_name,
      oi.status_date            AS item_status_date,
      oi.metadata               AS item_metadata,
      oi.sku_id,
      s.sku,
      s.barcode,
      s.country_code,
      s.size_label,
      p.id                      AS product_id,
      p.name                    AS product_name,
      p.brand,
      p.category,
      oi.packaging_material_id,
      pkg.code                  AS packaging_material_code,
      pkg.name                  AS packaging_material_name,
      pkg.color                 AS packaging_material_color,
      pkg.size                  AS packaging_material_size,
      pkg.unit                  AS packaging_material_unit,
      pkg.length_cm             AS packaging_material_length_cm,
      pkg.width_cm              AS packaging_material_width_cm,
      pkg.height_cm             AS packaging_material_height_cm,
      oi.created_at             AS item_created_at,
      oi.updated_at             AS item_updated_at,
      oi.created_by             AS item_created_by,
      ucb.firstname             AS item_created_by_firstname,
      ucb.lastname              AS item_created_by_lastname,
      oi.updated_by             AS item_updated_by,
      uub.firstname             AS item_updated_by_firstname,
      uub.lastname              AS item_updated_by_lastname
    FROM order_items oi
    LEFT JOIN order_status        ios  ON ios.id = oi.status_id
    LEFT JOIN skus                s    ON s.id = oi.sku_id
    LEFT JOIN products            p    ON p.id = s.product_id
    LEFT JOIN packaging_materials pkg  ON pkg.id = oi.packaging_material_id
    LEFT JOIN pricing             pr   ON pr.id = oi.price_id
    LEFT JOIN pricing_types       pt   ON pt.id = pr.price_type_id
    LEFT JOIN users               ucb  ON ucb.id = oi.created_by
    LEFT JOIN users               uub  ON uub.id = oi.updated_by
    WHERE oi.order_id = $1
    ORDER BY oi.created_at;
  `;
  
  const logMeta = {
    context: 'orderRepository.findOrderItemsByOrderId',
    severity: 'INFO',
    orderId,
    sqlTag: 'findOrderItemsByOrderId.v1',
  };
  try {
    const { rows } = await query(sql, [orderId]);
    
    if (rows.length === 0) {
      logSystemInfo('No order items found', { ...logMeta });
      return [];
    }
    
    logSystemInfo('Order items fetched', { ...logMeta, rowCount: rows.length });
    return rows;
  } catch (error) {
    logSystemException('DB error fetching order items', error, {
      ...logMeta,
      severity: 'ERROR',
    });
    
    throw AppError.databaseError('Failed to fetch order items.');
  }
};

module.exports = {
  insertOrderItemsBulk,
  findOrderItemsByOrderId,
};

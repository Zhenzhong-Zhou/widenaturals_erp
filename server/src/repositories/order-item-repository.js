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
  const rows = orderItems.map((item) => [
    orderId,
    item.sku_id ?? null,
    item.packaging_material_id ?? null,
    item.quantity_ordered,
    item.price_id ?? null,
    item.price ?? null,
    item.subtotal,
    item.status_id,
    item.metadata ?? null,
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
    'metadata',
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
    return await bulkInsert(
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

/**
 * Updates the status of all items in a given order.
 *
 * This function performs the following:
 * - Updates the `status_id`, `status_date`, `updated_at`, and `updated_by` fields
 *   in the `order_items` table for all items belonging to the specified order.
 * - Logs audit messages for success or failure.
 * - Returns the list of updated item records (`id`, `status_id`, `status_date`), or `null` if no items were found.
 *
 * Typically used alongside `updateOrderStatus` to keep order-level and item-level statuses in sync.
 *
 * @async
 * @param {object} client - An instance of a PostgreSQL client or transaction context (`pg.Client` or `pg.PoolClient`).
 * @param {object} params - Update parameters.
 * @param {string} params.orderId - UUID of the order whose items will be updated.
 * @param {string} params.newStatusId - UUID of the new status to assign to all items.
 * @param {string} params.updatedBy - UUID of the user performing the update (used for audit).
 * @returns {Promise<Array<{
 *   id: string,
 *   status_id: string,
 *   status_date: string
 * }> | null>} A list of updated order item rows, or `null` if no items were updated.
 *
 * @throws {AppError} If a database error occurs.
 */
const updateOrderItemStatuses = async (client, { orderId, newStatusId, updatedBy }) => {
  const sql = `
    UPDATE order_items
    SET
      status_id = $1,
      status_date = NOW(),
      updated_at = NOW(),
      updated_by = $2
    WHERE order_id = $3 AND status_id IS DISTINCT FROM $1
    RETURNING id, status_id, status_date
  `;
  
  const values = [newStatusId, updatedBy, orderId];
  
  try {
    const result = await query(sql, values, client);
    
    const updatedRows = result.rows || [];
    
    if (updatedRows.length === 0) {
      logSystemInfo('No order items updated: no items found for order', {
        context: 'order-item-repository/updateOrderItemStatuses',
        orderId,
        newStatusId,
        updatedBy,
        severity: 'WARN',
      });
      return null;
    }
    
    logSystemInfo('Order item statuses updated successfully', {
      context: 'order-item-repository/updateOrderItemStatuses',
      orderId,
      newStatusId,
      updatedBy,
      updatedCount: updatedRows.length,
      severity: 'INFO',
    });
    
    return updatedRows;
  } catch (error) {
    logSystemException(error, 'Failed to update order item statuses', {
      context: 'order-item-repository/updateOrderItemStatuses',
      orderId,
      newStatusId,
      updatedBy,
      severity: 'ERROR',
    });
    
    throw AppError.databaseError(`Failed to update order item statuses: ${error.message}`);
  }
};

/**
 * Retrieves all order items for a given order ID, including status metadata.
 *
 * This function queries the `order_items` table and joins related `orders` and `order_status`
 * tables to provide status category and code for each item. It's used to fetch the list of items
 * associated with a single sales order.
 *
 * Behavior:
 * - Accepts an optional DB client for transactional consistency.
 * - Logs success or failure using system-level structured logging.
 * - Throws an AppError if the query fails.
 *
 * @async
 * @function getOrderItemsByOrderId
 * @param {string} orderId - The UUID of the order whose items are being fetched.
 * @param {object} [client] - Optional PostgreSQL client for transaction context.
 * @returns {Promise<Array<object>>} Array of order items, each with fields:
 *   - order_item_id: UUID
 *   - sku_id: UUID | null
 *   - packaging_material_id: UUID | null
 *   - quantity_ordered: number
 *   - order_item_status_id: UUID
 *   - order_items_category: string
 *   - order_item_code: string
 *
 * @throws {AppError} If the query fails to execute.
 */
const getOrderItemsByOrderId = async (orderId, client) => {
  const sql = `
    SELECT
      oi.id AS order_item_id,
      oi.sku_id,
      oi.packaging_material_id,
      oi.quantity_ordered,
      oi.status_id AS order_item_status_id,
      os.category AS order_items_category,
      os.code AS order_item_code
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN order_status os ON oi.status_id = os.id
    WHERE o.id = $1;
  `;
  
  try {
    const result = await query(sql, [orderId], client);
    
    logSystemInfo('Fetched order items by order ID', {
      context: 'order-item-repository/getOrderItemsByOrderId',
      orderId,
      rowCount: result?.rows?.length ?? 0,
      severity: 'INFO',
    });
    
    return result.rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch order items by order ID', {
      context: 'order-item-repository/getOrderItemsByOrderId',
      orderId,
      severity: 'ERROR',
    });
    
    throw AppError.databaseError('Unable to retrieve order items for the specified order.');
  }
};

module.exports = {
  insertOrderItemsBulk,
  findOrderItemsByOrderId,
  updateOrderItemStatuses,
  getOrderItemsByOrderId,
};

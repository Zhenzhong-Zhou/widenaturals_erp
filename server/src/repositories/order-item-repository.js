const { bulkInsert, query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');

/**
 * Inserts multiple order items in bulk for a given order.
 *
 * Business rule:
 *  - Each order item must reference either a SKU (`sku_id`) or a packaging material (`packaging_material_id`), but not both.
 *  - On conflict, updates follow the specified strategies:
 *    - `quantity_ordered` → incremented
 *    - `price` → overwritten
 *    - `subtotal` → recalculated as `(EXCLUDED.price * (existing.quantity_ordered + EXCLUDED.quantity_ordered))`
 *    - `metadata` → merged (JSON/text append)
 *    - `updated_at` → overwritten
 *
 * Usage:
 *  - Call within a transaction when inserting new items or merging into an existing order.
 *  - Optimized to perform at most two bulk inserts: one for SKU items, one for packaging items.
 *
 * @async
 * @function
 * @param {string} orderId - The associated order ID
 * @param {Array<Object>} orderItems - List of order items to insert
 * @param {string|null} [orderItems[].sku_id] - SKU reference (mutually exclusive with packaging_material_id)
 * @param {string|null} [orderItems[].packaging_material_id] - Packaging material reference (mutually exclusive with sku_id)
 * @param {number} orderItems[].quantity_ordered - Quantity ordered
 * @param {string|null} [orderItems[].price_id] - Optional price reference
 * @param {number|null} [orderItems[].price] - Unit price
 * @param {number} [orderItems[].subtotal] - Subtotal (default: recalculated)
 * @param {string} orderItems[].status_id - Status ID
 * @param {string|Date} [orderItems[].status_date] - Optional status timestamp (default: now)
 * @param {Object|null} [orderItems[].metadata] - Optional metadata JSON object
 * @param {string|null} [orderItems[].created_by] - User ID who created the record
 * @param {string|null} [orderItems[].updated_by] - User ID who last updated the record
 * @param {import('pg').PoolClient} client - Active PostgreSQL transaction client
 *
 * @returns {Promise<Object[]>} Inserted or updated order item rows returned by `bulkInsert`
 *
 * @throws {AppError} Throws validation error for invalid items, or database error on failure
 *
 * @example
 * await insertOrderItemsBulk(orderId, [
 *   { sku_id: "sku-123", quantity_ordered: 2, price: 10, status_id: "active" },
 *   { packaging_material_id: "pack-456", quantity_ordered: 5, price: 2, status_id: "active" }
 * ], client);
 */
const insertOrderItemsBulk = async (orderId, orderItems, client) => {
  if (!Array.isArray(orderItems) || orderItems.length === 0) return [];

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

  const updateStrategies = {
    quantity_ordered: 'add',
    price: 'overwrite',
    subtotal: 'recalculate_subtotal',
    metadata: 'merge_json',
    updated_at: 'overwrite',
  };

  const mapToRow = (item) => [
    orderId,
    item.sku_id ?? null,
    item.packaging_material_id ?? null,
    item.quantity_ordered,
    item.price_id ?? null,
    item.price ?? null,
    item.subtotal ?? (item.price ?? 0) * item.quantity_ordered,
    item.status_id,
    item.metadata ?? null,
    null,
    item.created_by ?? null,
    item.updated_by ?? null,
  ];

  const skuItems = orderItems.filter(
    (item) => item.sku_id && !item.packaging_material_id
  );
  const packagingItems = orderItems.filter(
    (item) => !item.sku_id && item.packaging_material_id
  );

  // Validate input
  const invalidItems = orderItems.filter(
    (item) =>
      (item.sku_id && item.packaging_material_id) ||
      (!item.sku_id && !item.packaging_material_id)
  );

  if (invalidItems.length > 0) {
    throw new Error(
      `insertOrderItemsBulk(): Invalid items — each item must provide either sku_id or packaging_material_id (but not both).`
    );
  }

  try {
    const results = [];

    // Insert SKU items
    if (skuItems.length > 0) {
      const rows = skuItems.map(mapToRow);
      const result = await bulkInsert(
        'order_items',
        columns,
        rows,
        ['order_id', 'sku_id'], // Valid because packaging_material_id is null
        updateStrategies,
        client,
        { context: 'order-item-repository/insertOrderItemsBulk:sku' }
      );
      results.push(...result);
    }

    // Insert Packaging items
    if (packagingItems.length > 0) {
      const rows = packagingItems.map(mapToRow);
      const result = await bulkInsert(
        'order_items',
        columns,
        rows,
        ['order_id', 'packaging_material_id'], // Valid because sku_id is null
        updateStrategies,
        client,
        { context: 'order-item-repository/insertOrderItemsBulk:packaging' }
      );
      results.push(...result);
    }

    return results;
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
      ios.code                  AS item_status_code,
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
const updateOrderItemStatusesByOrderId = async (
  client,
  { orderId, newStatusId, updatedBy }
) => {
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
      logSystemInfo(
        'No order items updated by orderId: all statuses already match',
        {
          context: 'order-item-repository/updateOrderItemStatusesByOrderId',
          orderId,
          newStatusId,
          updatedBy,
          severity: 'WARN',
        }
      );
      return null;
    }

    logSystemInfo('Order item statuses updated successfully by orderId', {
      context: 'order-item-repository/updateOrderItemStatusesByOrderId',
      updateType: 'bulk_by_order_id',
      orderId,
      newStatusId,
      updatedBy,
      updatedCount: updatedRows.length,
      severity: 'INFO',
    });

    return updatedRows;
  } catch (error) {
    logSystemException(error, 'Failed to update order item statuses', {
      context: 'order-item-repository/updateOrderItemStatusesByOrderId',
      orderId,
      newStatusId,
      updatedBy,
      severity: 'ERROR',
    });

    throw AppError.databaseError(
      `Failed to update order item statuses: ${error.message}`
    );
  }
};

/**
 * Updates the status of a single order item, if the new status differs from the current one.
 *
 * This function updates the following fields on the `order_items` table:
 * - `status_id`
 * - `status_date` (set to current timestamp)
 * - `updated_at` (set to current timestamp)
 * - `updated_by` (the user who performed the update)
 *
 * If the item already has the specified status, no update is performed and `null` is returned.
 *
 * @param {object} client - The PostgreSQL client instance, typically from a transaction context.
 * @param {object} params - Parameters for the status update.
 * @param {string} params.orderItemId - UUID of the order item to update.
 * @param {string} params.newStatusId - UUID of the new status to set.
 * @param {string} params.updatedBy - UUID of the user performing the update.
 * @returns {Promise<{ id: string, status_id: string, status_date: string } | null>} The updated row (if any), or null if unchanged.
 * @throws {AppError} If the database update fails.
 *
 * @example
 * await updateOrderItemStatus(client, {
 *   orderItemId: 'abc123',
 *   newStatusId: 'status_confirmed',
 *   updatedBy: 'user_456',
 * });
 */
const updateOrderItemStatus = async (
  client,
  { orderItemId, newStatusId, updatedBy }
) => {
  const sql = `
    UPDATE order_items
    SET
      status_id = $1,
      status_date = NOW(),
      updated_at = NOW(),
      updated_by = $2
    WHERE id = $3 AND status_id IS DISTINCT FROM $1
    RETURNING id, status_id, status_date
  `;

  const values = [newStatusId, updatedBy, orderItemId];

  try {
    const result = await query(sql, values, client);
    const updatedRow = result.rows?.[0] ?? null;

    if (updatedRow) {
      logSystemInfo('Order item status updated successfully', {
        context: 'order-item-repository/updateOrderItemStatus',
        orderItemId,
        newStatusId,
        updatedBy,
      });
    } else {
      logSystemInfo('Order item status unchanged (already up-to-date)', {
        context: 'order-item-repository/updateOrderItemStatus',
        orderItemId,
        newStatusId,
        updatedBy,
        severity: 'DEBUG',
      });
    }

    return updatedRow;
  } catch (error) {
    logSystemException(error, 'Failed to update order item status', {
      context: 'order-item-repository/updateOrderItemStatus',
      orderItemId,
      newStatusId,
      updatedBy,
    });
    throw AppError.databaseError('Failed to update order item status.');
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

    throw AppError.databaseError(
      'Unable to retrieve order items for the specified order.'
    );
  }
};

/**
 * Validates that all order items in a given order are fully allocated.
 *
 * Business rule:
 *  - An order item is fully allocated if the sum of allocated quantities
 *    (from `inventory_allocations`) is greater than or equal to its
 *    `quantity_ordered`.
 *  - Fulfillment should be blocked if any item is underallocated.
 *
 * Behavior:
 *  - Returns `null` if the order is fully allocated.
 *  - Returns a truthy row (e.g., `{ underallocated_item_id: <UUID> }`)
 *    if at least one item is underallocated.
 *
 * Performance:
 *  - Uses `GROUP BY` + `HAVING` with `LIMIT 1` for early exit.
 *  - Requires indexes on `order_items(order_id)` and
 *    `inventory_allocations(order_item_id)` for best performance.
 *
 * @async
 * @function
 * @param {string} orderId - UUID of the order to check
 * @param {import('pg').PoolClient|null} [client=null] - Optional PostgreSQL client or transaction
 * @returns {Promise<{ underallocated_item_id: string } | null>}
 *   - `null` if fully allocated
 *   - Row containing the `order_item_id` of one underallocated item
 *
 * @throws {AppError} Throws `AppError.databaseError` if the query fails
 *
 * @example
 * const underAllocated = await validateFullAllocationForFulfillment(orderId);
 * if (underAllocated) {
 *   throw new Error(`Order cannot be fulfilled; item ${underAllocated.underallocated_item_id} is underallocated.`);
 * }
 */
const validateFullAllocationForFulfillment = async (orderId, client = null) => {
  const sql = `
    SELECT 1
    FROM order_items oi
    LEFT JOIN inventory_allocations ia ON ia.order_item_id = oi.id
    WHERE oi.order_id = $1
    GROUP BY oi.id, oi.quantity_ordered
    HAVING COALESCE(SUM(ia.allocated_quantity), 0) < oi.quantity_ordered
    LIMIT 1;
  `;

  try {
    const { rows } = await query(sql, [orderId], client);

    const isFullyAllocated = rows.length === 0;

    logSystemInfo(
      isFullyAllocated
        ? 'All order items are fully allocated.'
        : 'Some order items are not fully allocated.',
      {
        context: 'order-item-repository/validateFullAllocationForFulfillment',
        orderId,
        rowCount: rows.length,
      }
    );

    return rows[0] ?? null;
  } catch (error) {
    logSystemException(
      error,
      'Failed to validate order item allocations for fulfillment.',
      {
        context: 'order-item-repository/validateFullAllocationForFulfillment',
        orderId,
      }
    );

    throw AppError.databaseError(
      'Could not validate order allocation status.',
      {
        cause: error,
        orderId,
      }
    );
  }
};

module.exports = {
  insertOrderItemsBulk,
  findOrderItemsByOrderId,
  updateOrderItemStatusesByOrderId,
  updateOrderItemStatus,
  getOrderItemsByOrderId,
  validateFullAllocationForFulfillment,
};

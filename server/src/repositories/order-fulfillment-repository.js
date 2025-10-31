const { bulkInsert, query } = require('../database/db');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { buildFulfillmentFilter } = require('../utils/sql/build-order-fulfillment-filters');

/**
 * Inserts or updates multiple order fulfillment records in bulk.
 *
 * Business rules:
 * - Used during outbound fulfillment to persist item-level shipment progress.
 * - On conflict (`order_item_id`, `shipment_id`), applies these strategies:
 *   - `quantity_fulfilled`: incremented by new value
 *   - `status_id`: overwritten
 *   - `updated_at`: set to current timestamp
 *   - `fulfilled_by`: set only if previously null (coalesce)
 *   - `fulfillment_notes`: concatenated (merge_text strategy with timestamp prefix)
 *   - `updated_by`: overwritten
 *
 * Input expectations:
 * - `order_item_id`, `quantity_fulfilled`, and `shipment_id` are required.
 * - `allocation_id` is optional (nullable).
 * - Timestamps (`updated_at`) are managed automatically by conflict strategy.
 *
 * @async
 * @function
 * @param {Array<{
 *   order_item_id: string,
 *   allocation_id?: string | null,
 *   quantity_fulfilled: number,
 *   status_id?: string | null,
 *   shipment_id: string,
 *   fulfillment_notes?: string | null,
 *   fulfilled_by?: string | null,
 *   created_by?: string | null,
 *   updated_by?: string | null
 * }>} fulfillments - Flat array of fulfillment objects
 * @param {import('pg').PoolClient} client - Active PostgreSQL transaction client
 *
 * @returns {Promise<Array<{ id: string }>>} Array of inserted or updated fulfillment rows
 *
 * @throws {AppError} Throws `AppError.databaseError` if insert/update fails
 *
 * @example
 * await insertOrderFulfillmentsBulk([
 *   {
 *     order_item_id: "oi-123",
 *     allocation_id: "alloc-456",
 *     quantity_fulfilled: 10,
 *     status_id: "FULFILL_INIT",
 *     shipment_id: "ship-789",
 *     fulfilled_by: "user-abc",
 *     created_by: "user-abc",
 *     updated_by: "user-abc"
 *   }
 * ], client);
 */
const insertOrderFulfillmentsBulk = async (fulfillments, client) => {
  if (!Array.isArray(fulfillments) || fulfillments.length === 0) return [];
  
  const rows = fulfillments.map((f) => [
    f.order_item_id,
    f.allocation_id ?? null,
    f.quantity_fulfilled,
    f.status_id ?? null,
    f.shipment_id ?? null,
    f.fulfillment_notes ?? null,
    null,
    f.fulfilled_by ?? null,
    f.created_by ?? null,
    f.updated_by ?? null,
  ]);
  
  const columns = [
    'order_item_id',
    'allocation_id',
    'quantity_fulfilled',
    'status_id',
    'shipment_id',
    'fulfillment_notes',
    'updated_at',
    'fulfilled_by',
    'created_by',
    'updated_by',
  ];
  
  const conflictColumns = ['order_item_id', 'shipment_id'];
  
  const updateStrategies = {
    quantity_fulfilled: 'add',
    status_id: 'overwrite',
    updated_at: 'overwrite',
    fulfillment_notes: 'merge_text',
    fulfilled_by: 'coalesce',
    updated_by: 'overwrite',
  };
  
  try {
    const result = await bulkInsert(
      'order_fulfillments',
      columns,
      rows,
      conflictColumns,
      updateStrategies,
      client,
      { context: 'order-fulfillment-repository/insertOrderFulfillmentsBulk' },
      ['id', 'order_item_id']
    );
    
    logSystemInfo('Successfully inserted or updated order fulfillments', {
      context: 'order-fulfillment-repository/insertOrderFulfillmentsBulk',
      fulfillmentCount: fulfillments.length,
      resultCount: result.length,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to bulk insert order fulfillments', {
      context: 'order-fulfillment-repository/insertOrderFulfillmentsBulk',
      fulfillmentCount: fulfillments.length,
   });
    throw AppError.databaseError('Failed to insert order fulfillments', {
      cause: error,
    });
  }
};

/**
 * Fetches fulfillment records based on provided filters.
 *
 * Business rules:
 *  - Each fulfillment is linked to an order via its `order_item`.
 *  - Supports dynamic filtering (e.g., by orderId, fulfillmentId, status).
 *  - Prevents fetching orphaned fulfillments without valid order linkage.
 *
 * Usage:
 *  - Typically called during fulfillment adjustment or review flows.
 *  - Allows downstream services to update statuses, adjust inventory, or log activity.
 *
 * Performance:
 *  - Single query with JOIN on `order_items` (indexed by `order_id`).
 *  - O(n) where n = number of matching fulfillments.
 *
 * @async
 * @function
 * @param {Object} filters - Filter criteria for fulfillments
 * @param {string} [filters.orderId] - Optional order ID to filter fulfillments
 * @param {string} [filters.fulfillmentId] - Optional fulfillment ID
 * @param {string} [filters.statusId] - Optional status ID
 * @param {import('pg').PoolClient|null} [client=null] - Optional PostgreSQL client/transaction
 *
 * @returns {Promise<Array<{
 *   fulfillment_id: string,
 *   order_id: string,
 *   order_item_id: string,
 *   allocation_id: string,
 *   quantity_fulfilled: number,
 *   status_id: string,
 *   shipment_id: string
 * }>>} List of matching fulfillment records.
 *
 * @throws {AppError} If the query fails due to a database error
 *
 * @example
 * const fulfillments = await getOrderFulfillments({ orderId: 'order-123' });
 * // [
 * //   {
 * //     fulfillment_id: 'fulfill-001',
 * //     order_id: 'order-123',
 * //     order_item_id: 'item-456',
 * //     allocation_id: 'alloc-789',
 * //     quantity_fulfilled: 5,
 * //     status_id: 'FULFILLMENT_PENDING',
 * //     shipment_id: 'ship-321'
 * //   }
 * // ]
 */
const getOrderFulfillments = async (filters, client = null) => {
  const { whereClause, params } = buildFulfillmentFilter(filters);
  
  const sql = `
    SELECT
      f.id AS fulfillment_id,
      oi.order_id,
      f.order_item_id,
      f.allocation_id,
      f.quantity_fulfilled,
      f.status_id,
      f.shipment_id
    FROM order_fulfillments f
    JOIN order_items oi ON f.order_item_id = oi.id
    WHERE ${whereClause}
    ORDER BY f.created_at ASC
  `;
  
  try {
    const { rows } = await query(sql, params, client);
    
    logSystemInfo('Fetched order fulfillments successfully', {
      context: 'order-fulfillment-repository/getOrderFulfillments',
      filters,
      returnedCount: rows.length,
    });
    
    return rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch order fulfillments', {
      context: 'order-fulfillment-repository/getOrderFulfillments',
      filters,
    });
    
    throw AppError.databaseError(
      'Database query failed while fetching order fulfillments.',
      { cause: error, filters }
    );
  }
};

/**
 * Updates the status of one or more order fulfillment records.
 *
 * Business rules:
 *  - Fulfillment rows are updated in bulk by ID.
 *  - Each row’s `status_id` is set to the new status, and `fulfilled_at`/`updated_at`
 *    timestamps are refreshed.
 *  - `updated_by` is tracked for auditability.
 *  - If no matching rows exist, the update is skipped and a warning is logged.
 *
 * Usage:
 *  - Called when an order’s fulfillment stage advances (e.g., from `PENDING` → `PACKED`).
 *  - Intended for use inside transactional service flows.
 *
 * Performance:
 *  - O(n) update, where n = number of fulfillment IDs.
 *  - Optimized: single bulk update with `ANY($3::uuid[])`.
 *
 * @async
 * @function
 * @param {Object} params - Parameters for the update
 * @param {string} params.statusId - The new status ID to set
 * @param {string} params.userId - ID of the user performing the update
 * @param {string[]} params.fulfillmentIds - Array of fulfillment UUIDs to update
 * @param {import('pg').PoolClient} client - PostgreSQL client/transaction
 * @returns {Promise<string[]|number>} Array of updated fulfillment IDs, or 0 if none updated
 *
 * @throws {AppError} Database error if the update fails
 *
 * @example
 * const updatedIds = await updateOrderFulfillmentStatus(
 *   { statusId: 'FULFILLMENT_PACKED', userId: 'user-123', fulfillmentIds: ['f1', 'f2'] },
 *   client
 * );
 * // => ['f1', 'f2']
 */
const updateOrderFulfillmentStatus = async ({ statusId, userId, fulfillmentIds }, client) => {
  const sql = `
    UPDATE order_fulfillments
    SET
      status_id = $1,
      fulfilled_at = NOW(),
      updated_at = NOW(),
      updated_by = $2
    WHERE id = ANY($3::uuid[])
    RETURNING id
  `;
  
  const params = [statusId, userId, fulfillmentIds];
  
  try {
    const result = await query(sql, params, client);
    
    if (result.rowCount === 0) {
      logSystemInfo('Fulfillment status update skipped: no matching fulfillments', {
        context: 'order-fulfillment-repository/updateOrderFulfillmentStatus',
        statusId,
        userId,
        fulfillmentIds,
        severity: 'WARN',
      });
      return 0;
    }
    
    logSystemInfo('Order fulfillment statuses updated successfully', {
      context: 'order-fulfillment-repository/updateOrderFulfillmentStatus',
      updatedCount: result.rowCount,
      statusId,
      userId,
      fulfillmentIds,
      severity: 'INFO',
    });
    
    return result.rows.map(r => r.id);
  } catch (err) {
    logSystemException(err, 'Failed to update order fulfillment status', {
      context: 'order-fulfillment-repository/updateOrderFulfillmentStatus',
      statusId,
      userId,
      fulfillmentIds,
      severity: 'ERROR',
    });
    throw AppError.databaseError('Failed to update order fulfillment status');
  }
};

module.exports = {
  insertOrderFulfillmentsBulk,
  getOrderFulfillments,
  updateOrderFulfillmentStatus,
};

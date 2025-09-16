const { bulkInsert } = require('../database/db');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

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
      'id'
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

module.exports = {
  insertOrderFulfillmentsBulk,
};

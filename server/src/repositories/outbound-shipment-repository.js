const { bulkInsert } = require('../database/db');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Inserts or updates outbound shipment records in bulk.
 *
 * Business rules:
 * - Used to persist shipments created during fulfillment or manual operations.
 * - On conflict (order_id, warehouse_id[, tracking_number_id]), applies:
 *   - `status_id`: overwritten
 *   - `shipped_at`: overwritten
 *   - `expected_delivery_date`: overwritten
 *   - `notes`: merged with timestamped history (merge_text)
 *   - `shipment_details`: overwritten
 *   - `updated_by`: overwritten
 *   - `updated_at`: set to current timestamp
 *
 * Input expectations:
 * - `order_id`, `warehouse_id`, and `status_id` are required.
 * - `tracking_number_id` is optional (nullable).
 * - `updated_at` is managed internally (not provided by caller).
 *
 * @async
 * @function
 * @param {Array<{
 *   order_id: string,
 *   warehouse_id: string,
 *   delivery_method_id?: string | null,
 *   tracking_number_id?: string | null,
 *   status_id: string,
 *   shipped_at?: string | null,
 *   expected_delivery_date?: string | null,
 *   notes?: string | null,
 *   shipment_details?: object | null,
 *   created_by?: string | null,
 *   updated_by?: string | null,
 * }>} shipments - Array of outbound shipment objects
 *
 * @param {import('pg').PoolClient} client - Active PostgreSQL transaction client
 * @returns {Promise<Array<{ id: string }>>} Resolves with inserted or updated row IDs
 *
 * @throws {AppError} Throws `AppError.databaseError` if insert/update fails
 *
 * @example
 * await insertOutboundShipmentsBulk([
 *   {
 *     order_id: "ord-123",
 *     warehouse_id: "wh-001",
 *     status_id: "outbound_shipment_init",
 *     delivery_method_id: "deliv-456",
 *     created_by: "user-789"
 *   }
 * ], client);
 */
const insertOutboundShipmentsBulk = async (shipments, client) => {
  if (!Array.isArray(shipments) || shipments.length === 0) return [];
  
  const columns = [
    'order_id',
    'warehouse_id',
    'delivery_method_id',
    'tracking_number_id',
    'status_id',
    'shipped_at',
    'expected_delivery_date',
    'notes',
    'shipment_details',
    'created_by',
    'updated_by',
    'updated_at',
  ];
  
  const rows = shipments.map((s) => [
    s.order_id,
    s.warehouse_id,
    s.delivery_method_id ?? null,
    s.tracking_number_id ?? null,
    s.status_id,
    s.shipped_at ?? null,
    s.expected_delivery_date ?? null,
    s.notes ?? null,
    s.shipment_details ?? null,
    s.created_by ?? null,
    s.updated_by ?? null,
    null, // updated_at
  ]);
  
  const conflictColumns = ['order_id', 'warehouse_id'];
  
  const updateStrategies = {
    status_id: 'overwrite',
    shipped_at: 'overwrite',
    expected_delivery_date: 'overwrite',
    notes: 'merge_text',
    shipment_details: 'overwrite',
    updated_by: 'overwrite',
    updated_at: 'overwrite',
  };
  
  try {
    const result = await bulkInsert(
      'outbound_shipments',
      columns,
      rows,
      conflictColumns,
      updateStrategies,
      client,
      { context: 'outbound-shipment-repository/insertOutboundShipmentsBulk' },
      'id'
    );
    
    logSystemInfo('Successfully inserted or updated outbound shipments', {
      context: 'outbound-shipment-repository/insertOutboundShipmentsBulk',
      insertedCount: result.length,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to insert outbound shipments', {
      context: 'outbound-shipment-repository/insertOutboundShipmentsBulk',
      shipmentCount: shipments.length,
    });
    
    throw AppError.databaseError('Failed to insert outbound shipments', {
      cause: error,
    });
  }
};

module.exports = {
  insertOutboundShipmentsBulk,
};

const { bulkInsert, query, paginateResults } = require('../database/db');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { buildOutboundShipmentFilter } = require('../utils/sql/build-outbound-shipment-filters');

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

/**
 * Updates the status of one or more outbound shipment records.
 *
 * Business rules:
 *  - Shipment rows are updated in bulk by ID.
 *  - Each row’s `status_id` is set to the new status, and `shipped_at`/`updated_at`
 *    timestamps are refreshed.
 *  - `updated_by` is tracked for audit and traceability.
 *  - If no matching rows exist, the update is skipped and a warning is logged.
 *
 * Usage:
 *  - Called when outbound shipments advance to a new status (e.g., `PENDING` → `SHIPPED`).
 *  - Intended to be used within transactional service flows alongside fulfillment updates.
 *
 * Performance:
 *  - O(n) update, where n = number of shipment IDs.
 *  - Optimized: single bulk update with `ANY($3::uuid[])`.
 *
 * @async
 * @function
 * @param {Object} params - Parameters for the update
 * @param {string} params.statusId - The new status ID to set
 * @param {string} params.userId - ID of the user performing the update
 * @param {string[]} params.shipmentIds - Array of outbound shipment UUIDs to update
 * @param {import('pg').PoolClient} client - PostgreSQL client/transaction
 * @returns {Promise<string[]|number>} Array of updated shipment IDs, or 0 if none updated
 *
 * @throws {AppError} Database error if the update fails
 *
 * @example
 * const updatedShipments = await updateOutboundShipmentStatus(
 *   { statusId: 'SHIPMENT_SHIPPED', userId: 'user-123', shipmentIds: ['s1', 's2'] },
 *   client
 * );
 * // => ['s1', 's2']
 */
const updateOutboundShipmentStatus = async ({ statusId, userId, shipmentIds }, client) => {
  const sql = `
    UPDATE outbound_shipments
    SET
      status_id = $1,
      shipped_at = NOW(),
      updated_at = NOW(),
      updated_by = $2
    WHERE id = ANY($3::uuid[])
    RETURNING id
  `;
  
  const params = [statusId, userId, shipmentIds];
  
  try {
    const result = await query(sql, params, client);
    
    if (result.rowCount === 0) {
      logSystemInfo('Shipment status update skipped: no matching shipments', {
        context: 'outbound-shipment-repository/updateOutboundShipmentStatus',
        statusId,
        userId,
        shipmentIds,
        severity: 'WARN',
      });
      return 0;
    }
    
    logSystemInfo('Outbound shipment statuses updated successfully', {
      context: 'outbound-shipment-repository/updateOutboundShipmentStatus',
      updatedCount: result.rowCount,
      statusId,
      userId,
      shipmentIds,
      severity: 'INFO',
    });
    
    return result.rows.map(r => r.id);
  } catch (err) {
    logSystemException(err, 'Failed to update outbound shipment status', {
      context: 'outbound-shipment-repository/updateOutboundShipmentStatus',
      statusId,
      userId,
      shipmentIds,
      severity: 'ERROR',
    });
    throw AppError.databaseError('Failed to update outbound shipment status');
  }
};

/**
 * Fetches a paginated list of outbound shipment records with filtering, sorting, and logging.
 *
 * @param {Object} options - Query options
 * @param {Object} [options.filters={}] - Filtering criteria (delegated to buildOutboundShipmentFilter)
 * @param {number} [options.page=1] - Current page number (1-based)
 * @param {number} [options.limit=10] - Max rows per page
 * @param {string} [options.sortBy='created_at'] - Sort column (validated via outboundShipmentSortMap)
 * @param {string} [options.sortOrder='DESC'] - Sort direction (`ASC` or `DESC`)
 *
 * @returns {Promise<{
 *   data: any[];
 *   pagination: { page: number; limit: number; totalRecords: number; totalPages: number };
 * } | null>}
 * - Paginated results array with metadata, or `null` if no records were found.
 *
 * @throws {AppError}
 * - Wraps database errors in `AppError.databaseError` with query context.
 *
 * @note
 * - `sortBy` must be validated via `outboundShipmentSortMap` to prevent unsafe SQL injection.
 *
 * @logging
 * - Logs successful queries with filters, pagination, and sorting.
 * - Logs empty results with pagination context.
 * - Logs exceptions with error details.
 */
const getPaginatedOutboundShipmentRecords = async ({
                                                     filters = {},
                                                     page = 1,
                                                     limit = 10,
                                                     sortBy = 'created_at',
                                                     sortOrder = 'DESC',
                                                   }) => {
  const { whereClause, params } = buildOutboundShipmentFilter(filters);
  
  const dataQuery = `
    SELECT
      os.id AS shipment_id,
      os.order_id,
      o.order_number,
      os.warehouse_id,
      w.name AS warehouse_name,
      os.delivery_method_id,
      dm.method_name AS delivery_method,
      os.tracking_number_id,
      tn.tracking_number AS tracking_number,
      os.status_id,
      ss.code AS status_code,
      ss.name AS status_name,
      os.shipped_at,
      os.expected_delivery_date,
      os.notes,
      os.shipment_details,
      os.created_at,
      os.updated_at,
      os.created_by,
      u1.firstname AS created_by_firstname,
      u1.lastname AS created_by_lastname,
      os.updated_by,
      u2.firstname AS updated_by_firstname,
      u2.lastname AS updated_by_lastname
    FROM outbound_shipments os
    LEFT JOIN orders o ON os.order_id = o.id
    LEFT JOIN warehouses w ON os.warehouse_id = w.id
    LEFT JOIN delivery_methods dm ON os.delivery_method_id = dm.id
    LEFT JOIN tracking_numbers tn ON os.tracking_number_id = tn.id
    LEFT JOIN shipment_status ss ON os.status_id = ss.id
    LEFT JOIN users u1 ON os.created_by = u1.id
    LEFT JOIN users u2 ON os.updated_by = u2.id
    WHERE ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
  `;
  
  try {
    const result = await paginateResults({
      dataQuery,
      params,
      page,
      limit,
      meta: {
        context: 'outbound-shipment-repository/getPaginatedOutboundShipmentRecords',
      }
    });
    
    if (result.data.length === 0) {
      logSystemInfo('No outbound shipments found for current query', {
        context: 'outbound-shipment-repository/getPaginatedOutboundShipmentRecords',
        filters,
        pagination: { page, limit },
        sorting: { sortBy, sortOrder },
      });
      return null;
    }
    
    logSystemInfo('Fetched paginated outbound shipment records successfully', {
      context: 'outbound-shipment-repository/getPaginatedOutboundShipmentRecords',
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch paginated outbound shipment records', {
      context: 'outbound-shipment-repository/getPaginatedOutboundShipmentRecords',
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    throw AppError.databaseError('Failed to fetch paginated outbound shipment records', {
      context: 'outbound-shipment-repository/getPaginatedOutboundShipmentRecords',
    });
  }
};

module.exports = {
  insertOutboundShipmentsBulk,
  updateOutboundShipmentStatus,
  getPaginatedOutboundShipmentRecords,
};

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
 * Fetch a single outbound shipment record by its unique shipment ID.
 *
 * This function is optimized for use in workflow validation (e.g., during
 * fulfillment confirmation or shipment processing). It returns the essential
 * shipment metadata, including linked status information, for use in
 * downstream logic such as validation, status transitions, or audit logging.
 *
 * ## Notes
 * - Uses LEFT JOIN with `shipment_status` to resolve human-readable status metadata.
 * - Designed to run safely inside a transaction context.
 * - Returns `null` if no shipment record is found for the provided ID.
 * - Logs both successful queries and database exceptions.
 *
 * ## Example Return Object
 * ```js
 * {
 *   shipment_id: 'uuid',
 *   order_id: 'uuid',
 *   warehouse_id: 'uuid',
 *   status_id: 'uuid',
 *   status_code: 'SHIPMENT_READY',
 *   status_name: 'Ready to Ship',
 *   status_is_final: false
 * }
 * ```
 *
 * @async
 * @function
 * @param {string} shipmentId - UUID of the outbound shipment to fetch
 * @param {import('pg').PoolClient} client - PostgreSQL transaction client
 * @returns {Promise<object|null>} Shipment record with status fields, or null if not found
 *
 * @throws {AppError} Wrapped database error if the query fails
 */
const getShipmentByShipmentId = async (shipmentId, client) => {
  const sql = `
    SELECT
      os.id AS shipment_id,
      os.order_id,
      os.warehouse_id,
      os.status_id,
      ss.code AS status_code,
      ss.name AS status_name,
      ss.is_final AS status_is_final
    FROM outbound_shipments os
    LEFT JOIN shipment_status ss ON ss.id = os.status_id
    WHERE os.id = $1;
  `;
  
  try {
    const result = await query(sql, [shipmentId], client);
    const row = result?.rows?.[0] || null;
    
    if (!row) {
      logSystemInfo('No outbound shipment found for the given ID', {
        context: 'outbound-shipment-repository/getShipmentByShipmentId',
        shipmentId,
      });
      return null;
    }
    
    logSystemInfo('Successfully fetched outbound shipment by ID', {
      context: 'outbound-shipment-repository/getShipmentByShipmentId',
      shipmentId,
      statusCode: row.status_code,
      warehouseId: row.warehouse_id,
    });
    
    return row;
  } catch (error) {
    logSystemException(error, 'Failed to fetch outbound shipment by ID', {
      context: 'outbound-shipment-repository/getShipmentByShipmentId',
      shipmentId,
    });
    
    throw AppError.databaseError('Database error fetching outbound shipment record', {
      shipmentId,
      cause: error,
      context: 'outbound-shipment-repository/getShipmentByShipmentId',
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

/**
 * Fetch detailed outbound shipment information by shipment ID.
 *
 * The query joins across `outbound_shipments`, `order_fulfillments`,
 * `order_items`, `skus`, `products`, `packaging_materials`,
 * `shipment_batches`, and batch registries, including audit user metadata.
 *
 * Includes the following:
 *
 * **Shipment header**
 *  - Core: `shipment_id`, `order_id`, `warehouse_id`, `warehouse_name`
 *  - Delivery method: `delivery_method_id`, `delivery_method_name`,
 *    `delivery_method_is_pickup`, `delivery_method_estimated_time`
 *  - Status: `shipment_status_id`, `shipment_status_code`, `shipment_status_name`
 *  - Dates: `shipped_at`, `expected_delivery_date`
 *  - Notes/details: `shipment_notes`, `shipment_details`
 *  - Audit: `created_at`, `created_by` (with firstname/lastname),
 *    `updated_at`, `updated_by` (with firstname/lastname)
 *
 * **Tracking information**
 *  - Tracking number: `tracking_id`, `tracking_number`
 *  - Carrier/service: `carrier`, `service_name`, `bol_number`, `freight_type`
 *  - Status: `tracking_status_id`, `tracking_status_name`
 *  - Notes/dates: `tracking_notes`, `tracking_shipped_date`
 *
 * **Fulfillments**
 *  - Fulfillment core: `fulfillment_id`, `quantity_fulfilled`,
 *    `fulfilled_at`, `fulfillment_notes`
 *  - Status: `fulfillment_status_id`, `fulfillment_status_code`, `fulfillment_status_name`
 *  - Audit: `created_at`, `created_by` (with firstname/lastname),
 *    `updated_at`, `updated_by` (with firstname/lastname),
 *    `fulfilled_by` (with firstname/lastname)
 *
 * **Order Items**
 *  - Common: `order_item_id`, `quantity_ordered`
 *  - If product:
 *    - SKU: `sku_id`, `sku`, `barcode`, `country_code`, `size_label`, `market_region`
 *    - Product: `product_id`, `product_name`, `brand`, `series`, `category`
 *  - If packaging material:
 *    - Metadata: `packaging_material_id`, `packaging_material_code`,
 *      `packaging_material_name`, `packaging_material_color`,
 *      `packaging_material_size`, `packaging_material_unit`,
 *      `packaging_material_length_cm`, `packaging_material_width_cm`,
 *      `packaging_material_height_cm`
 *
 * **Batches**
 *  - Shipment batch: `shipment_batch_id`, `quantity_shipped`,
 *    `shipment_batch_notes`, `shipment_batch_created_at`,
 *    `shipment_batch_created_by` (with firstname/lastname)
 *  - Registry: `batch_registry_id`, `batch_type`
 *  - If product batch: `product_lot_number`, `product_expiry_date`
 *  - If packaging material batch: `packaging_material_batch_id`,
 *    `material_lot_number`, `material_expiry_date`,
 *    `material_snapshot_name`, `received_label_name`
 *
 * ---
 *
 * Note:
 * - The raw query returns a **flat array of rows** (one per fulfillment × batch).
 * - Shipment, tracking, and fulfillment headers will be duplicated across rows.
 * - Use a transformer (e.g. `transformShipmentDetailsRows`) to
 *   normalize into nested structure:
 *
 * ```ts
 * {
 *   shipment: ShipmentHeader,
 *   tracking: TrackingInfo | null,
 *   fulfillments: Fulfillment[] // each with orderItem + batches[]
 * }
 * ```
 *
 * @param {string} shipmentId - UUID of the outbound shipment
 * @returns {Promise<object[]>} Raw query result rows
 *
 * @example
 * [
 *   {
 *     shipment_id: 'uuid',
 *     warehouse_name: 'Main Warehouse',
 *     delivery_method_name: 'Standard Shipping',
 *     fulfillment_id: 'uuid',
 *     order_item_id: 'uuid',
 *
 *     // If product:
 *     sku: 'WN-MO400-S-UN',
 *     product_name: 'Seal Oil 400mg',
 *     product_lot_number: 'LOT-2024-001',
 *     product_expiry_date: '2026-12-31',
 *
 *     // If packaging material:
 *     packaging_material_name: 'Bottle 200ml Amber',
 *     material_lot_number: 'PM-001',
 *     material_expiry_date: '2030-01-01',
 *     received_label_name: 'Bottle 200ml Amber • pcs',
 *
 *     quantity_shipped: 100,
 *     batch_registry_id: 'uuid',
 *     batch_type: 'product' | 'packaging_material'
 *   },
 *   ...
 * ]
 *
 * @throws {AppError} Wrapped `databaseError` if the query fails
 */
const getShipmentDetailsById = async (shipmentId) => {
  const sql = `
    SELECT
      os.id AS shipment_id,
      os.order_id,
      os.warehouse_id,
      ws.name AS warehouse_name,
      os.delivery_method_id,
      dm.method_name AS delivery_method_name,
      dm.is_pickup_location AS delivery_method_is_pickup,
      dm.estimated_time AS delivery_method_estimated_time,
      os.status_id AS shipment_status_id,
      ss.code AS shipment_status_code,
      ss.name AS shipment_status_name,
      os.shipped_at,
      os.expected_delivery_date,
      os.notes AS shipment_notes,
      os.shipment_details,
      os.created_at,
      os.created_by,
      created_by_user.firstname AS shipment_created_by_firstname,
      created_by_user.lastname  AS shipment_created_by_lastname,
      os.updated_at,
      os.updated_by,
      updated_by_user.firstname AS shipment_updated_by_firstname,
      updated_by_user.lastname  AS shipment_updated_by_lastname,
      tn.id AS tracking_id,
      tn.tracking_number,
      tn.carrier,
      tn.service_name,
      tn.bol_number,
      tn.freight_type,
      tn.custom_notes AS tracking_notes,
      tn.shipped_date AS tracking_shipped_date,
      tn.status_id AS tracking_status_id,
      ts.name AS tracking_status_name,
      of.id AS fulfillment_id,
      of.quantity_fulfilled,
      of.fulfilled_at,
      of.fulfillment_notes,
      of.status_id AS fulfillment_status_id,
      fs.code AS fulfillment_status_code,
      fs.name AS fulfillment_status_name,
      of.created_at AS fulfillment_created_at,
      of.created_by AS fulfillment_created_by,
      fulfillment_created_by_user.firstname AS fulfillment_created_by_firstname,
      fulfillment_created_by_user.lastname  AS fulfillment_created_by_lastname,
      of.updated_at AS fulfillment_updated_at,
      of.updated_by AS fulfillment_updated_by,
      fulfillment_updated_by_user.firstname AS fulfillment_updated_by_firstname,
      fulfillment_updated_by_user.lastname  AS fulfillment_updated_by_lastname,
      of.fulfilled_by,
      fulfillment_fulfilled_by_user.firstname AS fulfillment_fulfilled_by_firstname,
      fulfillment_fulfilled_by_user.lastname  AS fulfillment_fulfilled_by_lastname,
      oi.id AS order_item_id,
      oi.quantity_ordered,
      s.id AS sku_id,
      s.sku,
      s.barcode,
      s.country_code,
      s.size_label,
      s.market_region,
      p.id AS product_id,
      p.name AS product_name,
      p.brand,
      p.series,
      p.category,
      oi.packaging_material_id,
      pkg.code   AS packaging_material_code,
      pkg.name   AS packaging_material_name,
      pkg.color  AS packaging_material_color,
      pkg.size   AS packaging_material_size,
      pkg.unit   AS packaging_material_unit,
      pkg.length_cm AS packaging_material_length_cm,
      pkg.width_cm  AS packaging_material_width_cm,
      pkg.height_cm AS packaging_material_height_cm,
      sb.id AS shipment_batch_id,
      sb.quantity_shipped,
      sb.notes AS shipment_batch_notes,
      sb.created_at AS shipment_batch_created_at,
      sb.created_by AS shipment_batch_created_by,
      shipment_batch_created_by_user.firstname AS shipment_batch_created_by_firstname,
      shipment_batch_created_by_user.lastname  AS shipment_batch_created_by_lastname,
      br.id AS batch_registry_id,
      br.batch_type,
      pb.lot_number  AS product_lot_number,
      pb.expiry_date AS product_expiry_date,
      pmb.id AS packaging_material_batch_id,
      pmb.lot_number AS material_lot_number,
      pmb.expiry_date AS material_expiry_date,
      pmb.material_snapshot_name,
      pmb.received_label_name
    FROM outbound_shipments os
    LEFT JOIN warehouses ws ON ws.id = os.warehouse_id
    LEFT JOIN delivery_methods dm ON dm.id = os.delivery_method_id
    LEFT JOIN shipment_status ss ON ss.id = os.status_id
    LEFT JOIN tracking_numbers tn ON tn.id = os.tracking_number_id
    LEFT JOIN status ts ON ts.id = tn.status_id
    LEFT JOIN users created_by_user ON created_by_user.id = os.created_by
    LEFT JOIN users updated_by_user ON updated_by_user.id = os.updated_by
    LEFT JOIN order_fulfillments of ON of.shipment_id = os.id
    LEFT JOIN fulfillment_status fs ON fs.id = of.status_id
    LEFT JOIN users fulfillment_created_by_user ON fulfillment_created_by_user.id = of.created_by
    LEFT JOIN users fulfillment_updated_by_user ON fulfillment_updated_by_user.id = of.updated_by
    LEFT JOIN users fulfillment_fulfilled_by_user ON fulfillment_fulfilled_by_user.id = of.fulfilled_by
    LEFT JOIN order_items oi ON oi.id = of.order_item_id
    LEFT JOIN skus s ON s.id = oi.sku_id
    LEFT JOIN products p ON p.id = s.product_id
    LEFT JOIN packaging_materials pkg ON pkg.id = oi.packaging_material_id
    LEFT JOIN shipment_batches sb ON sb.fulfillment_id = of.id
    LEFT JOIN batch_registry br ON br.id = sb.batch_id
    LEFT JOIN product_batches pb ON br.product_batch_id = pb.id
    LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id
    LEFT JOIN users shipment_batch_created_by_user ON shipment_batch_created_by_user.id = sb.created_by
    WHERE os.id = $1;
  `;
  
  try {
    const result = await query(sql, [shipmentId]);
    
    logSystemInfo('Fetched shipment details', {
      context: 'outbound-shipment-repository/getShipmentDetailsById',
      shipmentId,
      rowCount: result.rowCount,
    });
    
    return result.rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch shipment details', {
      context: 'outbound-shipment-repository/getShipmentDetailsById',
      shipmentId,
    });
    
    throw AppError.databaseError('Failed to fetch shipment details', {
      shipmentId,
    });
  }
};

module.exports = {
  insertOutboundShipmentsBulk,
  getShipmentByShipmentId,
  updateOutboundShipmentStatus,
  getPaginatedOutboundShipmentRecords,
  getShipmentDetailsById,
};

const { bulkInsert, query, paginateResults } = require('../database/db');
const { logSystemException, logSystemInfo, logSystemWarn } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { buildInventoryAllocationFilter } = require('../utils/sql/build-inventory-allocation-filters');

/**
 * Bulk inserts inventory allocation records into the `inventory_allocations` table.
 *
 * This function transforms a list of allocation objects into a tabular row format
 * and performs a batched insert using a shared `bulkInsert` utility. It supports
 * conflict resolution based on specified unique keys and applies update strategies
 * (e.g., overwriting or updating timestamps).
 *
 * @param {Array<Object>} allocations - List of allocation objects, where each item includes:
 *   - {string} order_item_id
 *   - {string|null} transfer_order_item_id
 *   - {string} warehouse_id
 *   - {string} batch_id
 *   - {number} allocated_quantity
 *   - {string} status_id
 *   - {string|Date|null} allocated_at
 *   - {string|null} created_by
 *   - {string|null} updated_by
 *   - {string|Date|null} updated_at
 *
 * @param {import('pg').PoolClient} client - PG client instance for transactional execution.
 *
 * @returns {Promise<Array>} - Result of the `bulkInsert` operation (inserted/updated rows).
 *
 * @throws {AppError} - Throws a database error if the insert fails.
 *
 * @example
 * await insertInventoryAllocationsBulk([
 *   {
 *     order_item_id: 'abc-123',
 *     transfer_order_item_id: null,
 *     warehouse_id: 'wh-001',
 *     batch_id: 'batch-456',
 *     allocated_quantity: 10,
 *     status_id: 'allocated',
 *     allocated_at: new Date(),
 *     created_by: 'user-001',
 *     updated_by: 'user-001',
 *     updated_at: new Date()
 *   }
 * ], dbClient);
 */
const insertInventoryAllocationsBulk = async (allocations, client) => {
  const rows = allocations.map((item) => [
    item.order_item_id ?? null,
    item.transfer_order_item_id ?? null,
    item.warehouse_id,
    item.batch_id,
    item.allocated_quantity,
    item.status_id,
    item.allocated_at ?? null,
    item.created_by ?? null,
    item.updated_by ?? null,
    item.updated_at ?? null,
  ]);
  
  const columns = [
    'order_item_id',
    'transfer_order_item_id',
    'warehouse_id',
    'batch_id',
    'allocated_quantity',
    'status_id',
    'allocated_at',
    'created_by',
    'updated_by',
    'updated_at',
  ];
  
  const conflictColumns = ['target_item_id', 'batch_id', 'warehouse_id'];
  
  const updateStrategies = {
    allocated_quantity: 'overwrite',
    status_id: 'overwrite',
    allocated_at: 'now',
    updated_by: 'overwrite',
    updated_at: 'now',
  };
  
  try {
   return await bulkInsert(
      'inventory_allocations',
      columns,
      rows,
      conflictColumns,
      updateStrategies,
      client,
      { context: 'inventory-allocation-repository/insertInventoryAllocationsBulk' }
    );
  } catch (error) {
    logSystemException(error, 'Failed to bulk insert inventory allocations', {
      context: 'inventory-allocation-repository/insertInventoryAllocationsBulk',
      data: allocations,
    });
    
    throw AppError.databaseError('Unable to insert inventory allocations in bulk.');
  }
};

/**
 * Updates the status and audit fields for one or more inventory allocation records.
 *
 * This function sets:
 * - `status_id` to the provided new status
 * - `allocated_at` and `updated_at` to the current timestamp
 * - `updated_by` to the user performing the update
 *
 * It logs a warning if no rows were updated (e.g. invalid allocation IDs),
 * and logs a success message if rows were updated.
 *
 * @async
 * @function
 *
 * @param {Object} input - Parameters for update.
 * @param {string} input.statusId - UUID of the new allocation status to set.
 * @param {string} input.userId - UUID of the user performing the update (for audit).
 * @param {string[]} input.allocationIds - UUIDs of allocation records to update.
 * @param {object} [client] - Optional PostgreSQL client for transactional execution.
 *
 * @returns {Promise<number>} - Number of allocation records updated.
 *
 * @throws {AppError} - Throws `AppError.databaseError` if the update fails.
 */
const updateInventoryAllocationStatus = async ({ statusId, userId, allocationIds }, client) => {
  const sql = `
    UPDATE inventory_allocations
    SET
      status_id = $1,
      allocated_at = NOW(),
      updated_at = NOW(),
      updated_by = $2
    WHERE id = ANY($3::uuid[])
    RETURNING id
  `;
  
  const params = [statusId, userId, allocationIds];
  
  try {
    const result = await query(sql, params, client);
    
    if (result.rowCount === 0) {
      logSystemInfo('Allocation status update skipped: no matching allocations', {
        context: 'inventory-allocation-repository/updateInventoryAllocationStatus',
        statusId,
        userId,
        allocationIds,
        severity: 'WARN',
      });
      return 0;
    }
    
    logSystemInfo('Inventory allocation statuses updated successfully', {
      context: 'inventory-allocation-repository/updateInventoryAllocationStatus',
      updatedCount: result.rowCount,
      statusId,
      userId,
      allocationIds,
      severity: 'INFO',
    });
    
    return result.rows.map(r => r.id);
  } catch (err) {
    logSystemException(err, 'Failed to update inventory allocation status', {
      context: 'inventory-allocation-repository/updateInventoryAllocationStatus',
      statusId,
      userId,
      allocationIds,
      severity: 'ERROR',
    });
    throw AppError.databaseError('Failed to update inventory allocation status');
  }
};

/**
 * Validates whether the provided allocation IDs are associated with a specific order.
 *
 * For each allocationId in the input array, this function checks if it belongs to an
 * order_item linked to the specified orderId. Any allocation ID that does not match
 * the given order is returned as a "mismatched" ID.
 *
 * If any mismatches are found, a warning is logged for traceability. If the database query
 * fails, a structured system exception is logged and a database error is thrown.
 *
 * @async
 * @param {string} orderId - UUID of the order to validate allocations against.
 * @param {string[]} allocationIds - List of allocation UUIDs to be checked.
 * @param {object} client - Database client instance (e.g., from a transaction).
 * @returns {Promise<string[]>} - List of allocation IDs not associated with the order.
 * @throws {AppError} - Throws AppError.databaseError on query failure.
 */
const getMismatchedAllocationIds = async (orderId, allocationIds, client) => {
  if (!allocationIds?.length) return [];
  
  const sql = `
    WITH input_ids AS (
      SELECT unnest($2::uuid[]) AS id
    ),
    valid_allocations AS (
      SELECT ia.id
      FROM inventory_allocations ia
      JOIN order_items oi ON ia.order_item_id = oi.id
      WHERE oi.order_id = $1
        AND ia.id = ANY($2::uuid[])
    )
    SELECT i.id
    FROM input_ids i
    LEFT JOIN valid_allocations v ON v.id = i.id
    WHERE v.id IS NULL;
  `;
  
  try {
    const { rows } = await query(sql, [orderId, allocationIds], client);
    
    if (rows.length > 0) {
      logSystemWarn('Mismatched allocation IDs detected', {
        context: 'inventory-allocations-repository/getMismatchedAllocationIds',
        orderId,
        mismatches: rows.map(r => r.id),
      });
    }
    
    return rows.map(r => r.id); // return mismatches
  } catch (error) {
    logSystemException(error, 'Failed to check mismatched allocation IDs', {
      context: 'inventory-allocations-repository/getMismatchedAllocationIds',
      orderId,
      allocationIds,
    });
    throw AppError.databaseError('Error validating allocation IDs');
  }
};

/**
 * Retrieves detailed review data for one or more inventory allocations within a specific order.
 *
 * For the given `orderId`, this function fetches all inventory allocation records that:
 * - Belong to the specified order
 * - Match the given `allocationIds` (if provided)
 * - Match the given `warehouseIds` (if provided)
 *
 * Each result row includes:
 * - Allocation metadata (ID, status, quantity, timestamps)
 * - Order item information (ID, quantity, status, etc.)
 * - Product or packaging material details
 * - Batch details including warehouse inventory list
 * - Related user information (creator/updater)
 * - Order-level metadata (status, note, createdBy)
 *
 * If `allocationIds` is an empty array, all allocations for the order are returned.
 * If `warehouseIds` is an empty array, all warehouses are included.
 *
 * Logs system info when allocations are found or not found.
 * Logs and throws a structured database error on failure.
 *
 * @async
 * @param {string} orderId - UUID of the order whose allocations are being reviewed.
 * @param {string[]} warehouseIds - Array of warehouse UUIDs to filter by (empty = all).
 * @param {string[]} allocationIds - Array of allocation UUIDs to include (empty = all for order).
 * @param {object} client - PostgreSQL client instance (supports transactions).
 * @returns {Promise<object[] | null>} - Array of enriched allocation rows, or `null` if none found.
 * @throws {AppError} - Throws `AppError.databaseError` if query execution fails.
 */
const getInventoryAllocationReview = async (orderId, warehouseIds, allocationIds, client) => {
  const sql = `
   WITH input_ids AS (
     SELECT
       $2::uuid[] AS warehouse_ids,
       $3::uuid[] AS allocation_ids
   ),
    selected_allocations AS (
      SELECT
        ia.id,
        ia.order_item_id,
        ia.transfer_order_item_id,
        ia.warehouse_id,
        ia.batch_id,
        ia.allocated_quantity,
        ia.status_id,
        ia.allocated_at,
        ia.created_at,
        ia.updated_at,
        ia.created_by,
        ia.updated_by
      FROM inventory_allocations ia
      JOIN order_items oi ON ia.order_item_id = oi.id
      JOIN input_ids i ON TRUE
      WHERE
        oi.order_id = $1
        AND (i.warehouse_ids IS NULL OR cardinality(i.warehouse_ids) = 0 OR ia.warehouse_id = ANY(i.warehouse_ids))
        AND (i.allocation_ids IS NULL OR cardinality(i.allocation_ids) = 0 OR ia.id = ANY(i.allocation_ids))
    )
    SELECT
      ia.id AS allocation_id,
      ia.order_item_id,
      ia.transfer_order_item_id,
      ia.batch_id,
      ia.allocated_quantity,
      ia.status_id AS allocation_status_id,
      s_alloc_status.name AS allocation_status_name,
      s_alloc_status.code AS allocation_status_code,
      ia.created_at AS allocation_created_at,
      ia.updated_at AS allocation_updated_at,
      ia.created_by AS allocation_created_by,
      ucb.firstname AS allocation_created_by_firstname,
      ucb.lastname  AS allocation_created_by_lastname,
      ia.updated_by AS allocation_updated_by,
      uub.firstname AS allocation_updated_by_firstname,
      uub.lastname  AS allocation_updated_by_lastname,
      oi.id AS order_item_id,
      oi.order_id,
      oi.quantity_ordered,
      oi.status_id AS item_status_id,
      ios.name AS item_status_name,
      oi.status_date AS item_status_date,
      oi.sku_id,
      s.sku,
      s.barcode,
      s.country_code,
      s.size_label,
      p.id AS product_id,
      p.name AS product_name,
      p.brand,
      p.category,
      oi.packaging_material_id,
      pkg.code AS packaging_material_code,
      pkg.name AS packaging_material_name,
      pkg.color AS packaging_material_color,
      pkg.size AS packaging_material_size,
      pkg.unit AS packaging_material_unit,
      pkg.length_cm AS packaging_material_length_cm,
      pkg.width_cm AS packaging_material_width_cm,
      pkg.height_cm AS packaging_material_height_cm,
      o.order_number,
      o.note AS order_note,
      o.order_type_id,
      ot.name AS order_type_name,
      o.order_status_id,
      os.name AS order_status_name,
      os.code AS order_status_code,
      o.created_by AS salesperson_id,
      u.firstname AS salesperson_firstname,
      u.lastname  AS salesperson_lastname,
      br.batch_type,
      CASE WHEN br.batch_type = 'product' THEN
        jsonb_build_object(
          'product_batch_id', pb.id,
          'lot_number',       pb.lot_number,
          'expiry_date',      pb.expiry_date,
          'manufacture_date', pb.manufacture_date,
          'warehouse_inventory', wi_arr.wi_list
        )
      END AS product_batch,
    
      CASE WHEN br.batch_type = 'packaging_material' THEN
        jsonb_build_object(
          'packaging_material_batch_id', pmb.id,
          'lot_number',       pmb.lot_number,
          'expiry_date',      pmb.expiry_date,
          'manufacture_date', pmb.manufacture_date,
          'material_snapshot_name', pmb.material_snapshot_name,
          'warehouse_inventory', wi_arr.wi_list
        )
      END AS packaging_material_batch
    FROM selected_allocations ia
    JOIN order_items oi ON ia.order_item_id = oi.id
    JOIN orders o ON oi.order_id = o.id
    JOIN users u ON o.created_by = u.id
    LEFT JOIN users ucb ON ia.created_by = ucb.id
    LEFT JOIN users uub ON ia.updated_by = uub.id
    LEFT JOIN inventory_allocation_status s_alloc_status ON ia.status_id = s_alloc_status.id
    LEFT JOIN order_status ios ON ios.id = oi.status_id
    LEFT JOIN skus s ON oi.sku_id = s.id
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN packaging_materials pkg ON oi.packaging_material_id = pkg.id
    LEFT JOIN order_types ot ON o.order_type_id = ot.id
    LEFT JOIN order_status os ON o.order_status_id = os.id
    JOIN batch_registry br ON ia.batch_id = br.id
    LEFT JOIN LATERAL (
      SELECT
        pb.id,
        pb.lot_number,
        pb.expiry_date,
        pb.manufacture_date
      FROM product_batches pb
      WHERE br.batch_type = 'product' AND pb.id = br.product_batch_id
    ) pb ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        pmb.id,
        pmb.lot_number,
        pmb.expiry_date,
        pmb.manufacture_date,
        pmb.material_snapshot_name
      FROM packaging_material_batches pmb
      WHERE br.batch_type = 'packaging_material' AND pmb.id = br.packaging_material_batch_id
    ) pmb ON TRUE
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
         jsonb_build_object(
           'warehouse_inventory_id', wi.id,
           'inbound_date', wi.inbound_date,
           'warehouse_quantity', wi.warehouse_quantity,
           'reserved_quantity', wi.reserved_quantity,
           'inventory_status_date', wi.status_date,
           'inventory_status_name', invs.name,
           'warehouse_name', w.name
         )
       ) AS wi_list
      FROM warehouse_inventory wi
      LEFT JOIN inventory_status invs ON invs.id = wi.status_id
      LEFT JOIN warehouses w ON w.id = wi.warehouse_id
      JOIN input_ids x ON TRUE
      WHERE wi.batch_id = br.id
        AND (x.warehouse_ids IS NULL OR cardinality(x.warehouse_ids) = 0 OR wi.warehouse_id = ANY(x.warehouse_ids))
    ) wi_arr ON TRUE
  `;
  
  try {
    const { rows } = await query(sql, [orderId, warehouseIds, allocationIds], client);
    
    if (rows.length === 0) {
      logSystemInfo('No allocations found for review', {
        context: 'inventory-allocations-repository/getInventoryAllocationReview',
        orderId,
        warehouseIds,
        allocationIds,
      });
      return null;
    }
    
    logSystemInfo('Fetched allocation review successfully', {
      context: 'inventory-allocations-repository/getInventoryAllocationReview',
      orderId,
      warehouseIds,
      allocationCount: rows.length,
    });
    
    return rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch allocation review', {
      context: 'inventory-allocations-repository/getInventoryAllocationReview',
      orderId,
      warehouseIds,
      allocationIds,
    });
    
    throw AppError.databaseError(
      'Error occurred while retrieving inventory allocation review'
    );
  }
};

/**
 * Fetches a paginated list of order-grouped inventory allocations with joined metadata.
 *
 * This query groups `inventory_allocations` by `order_id`, aggregates warehouse and
 * allocation data, and joins with related tables (`orders`, `customers`, `payment methods`, etc.).
 *
 * ### Filtering
 * - The `filters` object is parsed using `buildInventoryAllocationFilter`, which generates:
 *   - `rawAllocWhereClause` and `rawAllocParams` (for CTE-level filtering on `ia`)
 *   - `outerWhereClause` and `outerParams` (for outer-level filtering on `orders`, etc.)
 *
 * ### Sorting
 * - `sortBy` is **whitelisted only** (e.g., `created_at`, `order_number`). Unsafe fields will be rejected or fallback may apply.
 * - `sortOrder` must be `'ASC'` or `'DESC'` (default: `'DESC'`)
 *
 * ### Return Behavior
 * - Returns `null` if no results were found (`data.length === 0`)
 * - Returns a paginated result object if records exist
 *
 * ### Return Shape
 * ```ts
 * {
 *   data: Array<{
 *     order_id: string;
 *     order_number: string;
 *     order_type: string | null;
 *     order_category: string | null;
 *     order_status_name: string | null;
 *     order_status_code: string | null;
 *     customer_firstname: string | null;
 *     customer_lastname: string | null;
 *     payment_method: string | null;
 *     payment_status: string | null;
 *     delivery_method: string | null;
 *     total_items: number;
 *     allocated_items: number;
 *     allocated_at: string | null;
 *     allocated_created_at: string | null;
 *     created_at: string;
 *     created_by_firstname: string | null;
 *     created_by_lastname: string | null;
 *     updated_at: string | null;
 *     updated_by_firstname: string | null;
 *     updated_by_lastname: string | null;
 *     warehouse_ids: string[];
 *     warehouse_names: string;
 *     allocation_status_codes: string[];
 *     allocation_statuses: string;
 *     allocation_summary_status:
 *       | 'Failed'
 *       | 'Fully Allocated'
 *       | 'Partially Allocated'
 *       | 'Pending Allocation'
 *       | 'Unknown';
 *     allocation_ids: string[];
 *   }>,
 *   pagination: {
 *     page: number;
 *     limit: number;
 *     totalRecords: number;
 *     totalPages: number;
 *   }
 * }
 * ```
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - Filter criteria (passed to `buildInventoryAllocationFilter`)
 * @param {number} [options.page=1] - Current page number (1-based)
 * @param {number} [options.limit=10] - Number of records per page
 * @param {string} [options.sortBy='created_at'] - Whitelisted field to sort by
 * @param {string} [options.sortOrder='DESC'] - Sort direction ('ASC' | 'DESC')
 *
 * @returns {Promise<{
 *   data: any[];
 *   pagination: {
 *     page: number;
 *     limit: number;
 *     totalRecords: number;
 *     totalPages: number;
 *   };
 * } | null>} Paginated result set or null if no matches found
 *
 * @throws {AppError} Throws `AppError.databaseError` on failure
 */
const getPaginatedInventoryAllocations = async ({
                                                  filters = {},
                                                  page = 1,
                                                  limit = 10,
                                                  sortBy = 'created_at',
                                                  sortOrder = 'DESC',
                                                }) => {
  const {
    rawAllocWhereClause,
    rawAllocParams,
    outerWhereClause,
    outerParams,
  } = buildInventoryAllocationFilter(filters);
  
  const baseQuery = `
    WITH raw_alloc AS (
      SELECT
        oi.order_id,
        ARRAY_AGG(DISTINCT ia.id) AS allocation_ids,
        COUNT(DISTINCT ia.id)                         AS allocated_items,
        ARRAY_AGG(DISTINCT w.id)                      AS warehouse_ids,
        STRING_AGG(DISTINCT w.name, ', ' ORDER BY w.name) AS warehouse_names,
        ARRAY_AGG(DISTINCT s.code)                    AS allocation_status_codes,
        MIN(ia.allocated_at)                             AS allocated_at,
        MIN(ia.created_at)                               AS allocated_created_at,
        STRING_AGG(DISTINCT s.name, ', ' ORDER BY s.name) AS allocation_statuses
      FROM inventory_allocations ia
      JOIN order_items oi ON oi.id = ia.order_item_id
      LEFT JOIN warehouses w ON w.id = ia.warehouse_id
      LEFT JOIN inventory_allocation_status s ON s.id = ia.status_id
      WHERE ${rawAllocWhereClause}
      GROUP BY oi.order_id
    ),
    alloc_agg AS (
      SELECT *,
        CASE
          WHEN ARRAY['ALLOC_FAILED'] <@ allocation_status_codes::text[] THEN 'Failed'
          WHEN ARRAY['ALLOC_CONFIRMED'] <@ allocation_status_codes::text[]
               AND NOT ARRAY['ALLOC_PENDING'] <@ allocation_status_codes::text[]
          THEN 'Fully Allocated'
          WHEN ARRAY['ALLOC_CONFIRMED'] <@ allocation_status_codes::text[]
               AND ARRAY['ALLOC_PENDING'] <@ allocation_status_codes::text[]
          THEN 'Partially Allocated'
          WHEN ARRAY['ALLOC_PENDING'] <@ allocation_status_codes::text[]
               AND cardinality(allocation_status_codes) = 1
          THEN 'Pending Allocation'
          ELSE 'Unknown'
        END AS allocation_summary_status
      FROM raw_alloc
    ),
    item_counts AS (
      SELECT oi.order_id, COUNT(*) AS total_items
      FROM order_items oi
      GROUP BY oi.order_id
    )
    SELECT
      o.id AS order_id,
      o.order_number,
      ot.name AS order_type,
      ot.category AS order_category,
      os.name AS order_status_name,
      os.code AS order_status_code,
      c.firstname AS customer_firstname,
      c.lastname  AS customer_lastname,
      pm.name AS payment_method,
      ps.name AS payment_status,
      dm.method_name AS delivery_method,
      ic.total_items,
      aa.allocated_items,
      aa.allocated_at,
      aa.allocated_created_at,
      o.created_at,
      u1.firstname AS created_by_firstname,
      u1.lastname  AS created_by_lastname,
      o.updated_at,
      u2.firstname AS updated_by_firstname,
      u2.lastname  AS updated_by_lastname,
      aa.warehouse_ids,
      aa.allocation_ids,
      aa.warehouse_names,
      aa.allocation_status_codes,
      aa.allocation_statuses,
      aa.allocation_summary_status
    FROM alloc_agg aa
    JOIN orders o             ON o.id = aa.order_id
    LEFT JOIN item_counts ic  ON ic.order_id = o.id
    LEFT JOIN sales_orders so ON so.id = o.id
    LEFT JOIN customers c       ON c.id = so.customer_id
    LEFT JOIN payment_methods pm ON pm.id = so.payment_method_id
    LEFT JOIN payment_status ps  ON ps.id = so.payment_status_id
    LEFT JOIN delivery_methods dm ON dm.id = so.delivery_method_id
    LEFT JOIN order_types ot     ON ot.id = o.order_type_id
    LEFT JOIN order_status os    ON os.id = o.order_status_id
    LEFT JOIN users u1            ON u1.id = o.created_by
    LEFT JOIN users u2           ON u2.id = o.updated_by
    WHERE ${outerWhereClause}
    ORDER BY ${sortBy} ${sortOrder}
  `;
  
  try {
    const result = await paginateResults({
      dataQuery: baseQuery,
      params: [...rawAllocParams, ...outerParams],
      page,
      limit,
    });
    
    if (result.data.length === 0) {
      logSystemInfo('No inventory allocations found', {
        context: 'inventory-allocations-repository/getPaginatedInventoryAllocations',
        pagination: { page, limit },
        sorting: { sortBy, sortOrder },
      });
      return null;
    }
    
    logSystemInfo('Fetched paginated inventory allocations', {
      context: 'inventory-allocations-repository/getPaginatedInventoryAllocations',
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch paginated inventory allocations', {
      context: 'inventory-allocations-repository/getPaginatedInventoryAllocations',
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    throw AppError.databaseError('Error fetching inventory allocation list');
  }
};

module.exports = {
  insertInventoryAllocationsBulk,
  updateInventoryAllocationStatus,
  getMismatchedAllocationIds,
  getInventoryAllocationReview,
  getPaginatedInventoryAllocations,
};

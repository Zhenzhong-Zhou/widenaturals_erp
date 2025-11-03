const {
  query,
  paginateQuery,
  retry,
  bulkInsert,
  formatBulkUpdateQuery,
  paginateResults,
} = require('../database/db');
const AppError = require('../utils/AppError');
const {
  logSystemInfo,
  logSystemException,
  logSystemWarn,
} = require('../utils/system-logger');
const { logError } = require('../utils/logger-helper');
const {
  buildWarehouseInventoryWhereClause,
} = require('../utils/sql/build-warehouse-inventory-filters');
const {
  getStatusIdByQuantity,
} = require('../utils/query/inventory-query-utils');

/**
 * Fetches a paginated summary of warehouse inventory items, including both product SKUs and packaging materials.
 *
 * This function aggregates inventory data from `warehouse_inventory` (products) and `location_inventory` (materials),
 * grouped by SKU or material code. It includes:
 * - Total inventory entries
 * - Recorded, actual, available, and reserved quantities
 * - Earliest manufacture and nearest expiry dates
 * - Inventory status derived from warehouse records
 * - Active status (based on provided `statusId`) or presence of quantity > 0
 *
 * Filtering:
 * - Products and SKUs are included if they are active OR have warehouse quantity > 0
 * - Materials are included if they are active OR have location quantity > 0
 * - If `itemType` is specified, only that group is included
 *
 * @param {Object} options
 * @param {number} [options.page=1] - The page number for pagination.
 * @param {number} [options.limit=20] - The number of items per page.
 * @param {string} options.statusId - Required. The internal UUID for the 'active' status, used to match products, SKUs, and materials.
 * @param {string} [options.itemType] - Optional. `'product'`, `'material'`, or omitted for both.
 * @returns {Promise<{ data: any[], meta: { page: number, total: number } }>} A paginated summary of warehouse inventory grouped by SKU or material code.
 */
const getPaginatedWarehouseInventoryItemSummary = async ({
  page = 1,
  limit = 20,
  itemType,
  statusId,
}) => {
  const includeProducts =
    itemType === 'product' || itemType === undefined || itemType === null;
  const includeMaterials =
    itemType === 'packaging_material' ||
    itemType === undefined ||
    itemType === null;

  const ctes = [];

  if (includeProducts) {
    ctes.push(`
      product_lot_agg AS (
        SELECT
          pb.sku_id,
          COUNT(DISTINCT li.id) AS total_lots,
          SUM(li.location_quantity) AS total_lot_quantity,
          MIN(pb.manufacture_date) AS earliest_manufacture_date,
          MIN(pb.expiry_date) AS nearest_expiry_date,
          SUM(li.location_quantity - li.reserved_quantity) AS total_available_quantity,
          SUM(li.reserved_quantity) AS total_reserved_quantity
        FROM location_inventory li
        JOIN batch_registry br ON li.batch_id = br.id
        JOIN product_batches pb ON br.product_batch_id = pb.id
        GROUP BY pb.sku_id
      ),
      product_status_priority AS (
        SELECT
          pb.sku_id,
          MIN(isp.priority) AS min_priority
        FROM warehouse_inventory wi
        JOIN batch_registry br ON wi.batch_id = br.id
        JOIN product_batches pb ON br.product_batch_id = pb.id
        JOIN inventory_status ist ON wi.status_id = ist.id
        JOIN inventory_status_priority isp ON ist.name = isp.name
        GROUP BY pb.sku_id
      )
    `);
  }

  if (includeMaterials) {
    ctes.push(`
      material_status_priority AS (
        SELECT
          pm.id AS packaging_material_id,
          MIN(isp.priority) AS min_priority
        FROM warehouse_inventory wi
        JOIN batch_registry br ON wi.batch_id = br.id
        JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id
        JOIN packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id
        JOIN packaging_materials pm ON pms.packaging_material_id = pm.id
        JOIN inventory_status ist ON wi.status_id = ist.id
        JOIN inventory_status_priority isp ON ist.name = isp.name
        GROUP BY pm.id
      )
    `);
  }

  const sharedCTE = `
    inventory_status_priority AS (
      SELECT * FROM (
        VALUES
          ('expired', 1),
          ('suspended', 2),
          ('unavailable', 3),
          ('out_of_stock', 4),
          ('in_stock', 5),
          ('unassigned', 6)
      ) AS isp(name, priority)
    )
  `;

  const fullCTE = `WITH\n${[sharedCTE, ...ctes].join(',\n')}`;

  const selectParts = [];

  if (includeProducts) {
    selectParts.push(`
      SELECT
        s.id AS item_id,
        'product' AS item_type,
        s.sku,
        COALESCE(NULLIF(p.name, ''), s.sku) AS item_name,
        p.brand,
        s.country_code,
        s.size_label,
        COUNT(DISTINCT wi.id) AS total_inventory_entries,
        COALESCE(SUM(wi.warehouse_quantity), 0) AS recorded_quantity,
        COALESCE(l.total_lot_quantity, 0) AS actual_quantity,
        COALESCE(l.total_available_quantity, 0) AS total_available_quantity,
        COALESCE(l.total_reserved_quantity, 0) AS total_reserved_quantity,
        COALESCE(l.total_lots, 0) AS total_lots,
        COALESCE(l.total_lot_quantity, 0) AS total_lot_quantity,
        l.earliest_manufacture_date,
        l.nearest_expiry_date,
        sp.min_priority,
        isp.name AS display_status,
        (p.status_id = $1 AND s.status_id = $1) AS is_active
      FROM warehouse_inventory wi
      JOIN batch_registry br ON wi.batch_id = br.id
      JOIN product_batches pb ON br.product_batch_id = pb.id
      JOIN skus s ON pb.sku_id = s.id
      JOIN products p ON s.product_id = p.id
      LEFT JOIN product_lot_agg l ON s.id = l.sku_id
      LEFT JOIN product_status_priority sp ON s.id = sp.sku_id
      LEFT JOIN inventory_status_priority isp ON sp.min_priority = isp.priority
      GROUP BY
        s.id, s.sku, p.name, p.brand, s.country_code, s.size_label,
        l.total_lots, l.total_lot_quantity,
        l.total_available_quantity, l.total_reserved_quantity,
        l.earliest_manufacture_date, l.nearest_expiry_date,
        sp.min_priority, isp.name, p.status_id, s.status_id
      HAVING
        (p.status_id = $1 AND s.status_id = $1)
        OR SUM(wi.warehouse_quantity) > 0
    `);
  }

  if (includeMaterials) {
    selectParts.push(`
      SELECT
        pm.id AS item_id,
        'packaging_material' AS item_type,
        pm.code AS item_code,
        pm.name AS item_name,
        NULL AS brand,
        NULL AS country_code,
        NULL AS size_label,
        COUNT(DISTINCT wi.id) AS total_inventory_entries,
        COALESCE(SUM(wi.warehouse_quantity), 0) AS recorded_quantity,
        COALESCE(SUM(wi.warehouse_quantity), 0) AS actual_quantity,
        COALESCE(SUM(wi.warehouse_quantity - wi.reserved_quantity), 0) AS total_available_quantity,
        COALESCE(SUM(wi.reserved_quantity), 0) AS total_reserved_quantity,
        COUNT(DISTINCT pmb.id) AS total_lots,
        COALESCE(SUM(wi.warehouse_quantity), 0) AS total_lot_quantity,
        MIN(pmb.manufacture_date) AS earliest_manufacture_date,
        MIN(pmb.expiry_date) AS nearest_expiry_date,
        sp.min_priority,
        isp.name AS display_status,
        (pm.status_id = $1) AS is_active
      FROM warehouse_inventory wi
      JOIN batch_registry br ON wi.batch_id = br.id
      JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id
      JOIN packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id
      JOIN packaging_materials pm ON pms.packaging_material_id = pm.id
      LEFT JOIN material_status_priority sp ON pm.id = sp.packaging_material_id
      LEFT JOIN inventory_status_priority isp ON sp.min_priority = isp.priority
      WHERE pm.status_id = $1 OR wi.warehouse_quantity > 0
      GROUP BY
        pm.id, pm.code, pm.name, pm.status_id,
        sp.min_priority, isp.name
    `);
  }

  const finalQuery = `${fullCTE}\n${selectParts.join('\nUNION ALL\n')}`;

  try {
    logSystemInfo(
      'Fetching paginated warehouse inventory summary (products + materials)',
      {
        context: 'warehouse-inventory-repository',
        params: { page, limit, statusId, itemType },
      }
    );

    return await paginateResults({
      dataQuery: finalQuery,
      params: [statusId],
      page,
      limit,
    });
  } catch (error) {
    logSystemException(
      'Error fetching paginated warehouse inventory summary (products + materials)',
      {
        context: 'warehouse-inventory-repository',
        error,
      }
    );

    throw AppError.databaseError(
      'Failed to fetch paginated warehouse inventory items summary'
    );
  }
};

/**
 * Fetch paginated warehouse inventory summary details for a given item ID
 * (product SKU or packaging material).
 *
 * @param {Object} options - Pagination and filter options
 * @param {number} options.page - The page number for pagination
 * @param {number} options.limit - Number of records per page
 * @param {string} options.itemId - The SKU ID (for products) or Material ID (for packaging materials)
 * @returns {Promise<Object>} Paginated result with raw warehouse inventory summary data
 * @throws {AppError} If the database query fails
 */
const getWarehouseInventorySummaryDetailsByItemId = async ({
  page,
  limit,
  itemId,
}) => {
  const queryText = `
    SELECT
      wi.id AS warehouse_inventory_id,
      br.batch_type,
      s.id AS sku_id,
      s.sku,
      pm.id AS material_id,
      pm.code AS material_code,
      CASE
        WHEN br.batch_type = 'product' THEN pb.lot_number
        WHEN br.batch_type = 'packaging_material' THEN pmb.lot_number
        ELSE NULL
      END AS lot_number,
      pb.manufacture_date AS product_manufacture_date,
      pb.expiry_date AS product_expiry_date,
      pmb.manufacture_date AS material_manufacture_date,
      pmb.expiry_date AS material_expiry_date,
      wi.warehouse_quantity,
      wi.reserved_quantity,
      wi.status_id,
      ist.name AS status_name,
      wi.status_date,
      wi.inbound_date,
      wi.outbound_date,
      wi.last_update,
      w.id AS warehouse_id,
      w.name AS warehouse_name
    FROM warehouse_inventory wi
    JOIN warehouses w ON wi.warehouse_id = w.id
    JOIN batch_registry br ON wi.batch_id = br.id
    LEFT JOIN product_batches pb ON br.product_batch_id = pb.id
    LEFT JOIN skus s ON pb.sku_id = s.id
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id
    LEFT JOIN packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id
    LEFT JOIN packaging_materials pm ON pms.packaging_material_id = pm.id
    JOIN inventory_status ist ON wi.status_id = ist.id
    WHERE
      (
        (br.batch_type = 'product' AND s.id = $1)
        OR
        (br.batch_type = 'packaging_material' AND pm.id = $1)
      )
    ORDER BY wi.last_update DESC;
  `;

  try {
    return await paginateResults({
      dataQuery: queryText,
      params: [itemId],
      page,
      limit,
      meta: {
        context:
          'warehouse-inventory-repository/getWarehouseInventorySummaryDetailsByItemId',
      },
    });
  } catch (error) {
    logSystemException(
      error,
      'Failed to fetch warehouse inventory summary details',
      {
        context:
          'warehouse-inventory-repository/getWarehouseInventorySummaryDetailsByItemId',
        itemId,
        page,
        limit,
      }
    );

    throw AppError.databaseError(
      'Failed to fetch warehouse inventory summary details by item ID'
    );
  }
};

/**
 * Fetches paginated and enriched warehouse inventory records.
 *
 * This query joins related metadata from multiple tables such as
 * - Warehouse and inventory status
 * - Product, SKU, and manufacturer (for product-type inventory)
 * - Packaging material, supplier, and part (for packaging-material-type inventory)
 * - Created/updated usernames
 *
 * Key characteristics:
 * - Includes all inventory records, even those with total_quantity = 0 or reserved_quantity = 0,
 *   to reflect full warehouse inventory history and visibility.
 * - Dynamically supports filtering, sorting, and pagination.
 * - Filters can target either product-based or packaging-material-based inventory types.
 *
 * @param {Object} options - Query configuration object
 * @param {number} options.page - Current page number (1-based)
 * @param {number} options.limit - Number of records per page
 * @param {Object} [options.filters] - Optional filters for narrowing the result set
 * @param {string} [options.safeSortClause] - A pre-sanitized SQL ORDER BY clause (e.g., "wi.last_update DESC")
 *
 * @returns {Promise<{
 *   data: Array<Object>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }>} Paginated warehouse inventory data with enriched metadata
 */
const getPaginatedWarehouseInventoryRecords = async ({
  page,
  limit,
  filters,
  safeSortClause,
}) => {
  const tableName = 'warehouse_inventory wi';

  const joins = [
    'LEFT JOIN warehouses wh ON wi.warehouse_id = wh.id',
    'LEFT JOIN locations l ON wh.location_id = l.id',
    'LEFT JOIN inventory_status st ON wi.status_id = st.id',
    'LEFT JOIN users uc ON wi.created_by = uc.id',
    'LEFT JOIN users uu ON wi.updated_by = uu.id',
    'LEFT JOIN batch_registry br ON wi.batch_id = br.id',
    'LEFT JOIN product_batches pb ON br.product_batch_id = pb.id',
    'LEFT JOIN skus s ON pb.sku_id = s.id',
    'LEFT JOIN products p ON s.product_id = p.id',
    'LEFT JOIN manufacturers mfp ON pb.manufacturer_id = mfp.id',
    'LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id',
    'LEFT JOIN packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id',
    'LEFT JOIN packaging_materials pm ON pms.packaging_material_id = pm.id',
    'LEFT JOIN suppliers sup ON pms.supplier_id = sup.id',
    'LEFT JOIN part_materials pmat ON pm.id = pmat.packaging_material_id',
    'LEFT JOIN parts pt ON pmat.part_id = pt.id',
  ];

  const { whereClause, params } = buildWarehouseInventoryWhereClause(filters);

  const queryText = `
    SELECT
      wi.id AS warehouse_inventory_id,
      br.batch_type AS item_type,
      wi.warehouse_id,
      wh.name AS warehouse_name,
      l.id AS location_id,
      wi.warehouse_quantity,
      wi.reserved_quantity,
      wi.warehouse_fee,
      wi.inbound_date,
      wi.outbound_date,
      wi.last_update,
      wi.created_at,
      wi.updated_at,
      st.name AS status_name,
      wi.status_date,
      uc.firstname AS created_by_firstname,
      uc.lastname AS created_by_lastname,
      uu.firstname AS updated_by_firstname,
      uu.lastname AS updated_by_lastname,
      mfp.name AS product_manufacturer_name,
      sup.name AS material_supplier_name,
      br.id AS batch_id,
      pb.lot_number AS product_lot_number,
      pb.manufacture_date AS product_manufacture_date,
      pb.expiry_date AS product_expiry_date,
      pmb.material_snapshot_name AS material_name,
      pmb.received_label_name AS received_label_name,
      pmb.lot_number AS material_lot_number,
      pmb.manufacture_date AS material_manufacture_date,
      pmb.expiry_date AS material_expiry_date,
      p.name AS product_name,
      p.brand AS brand_name,
      s.sku AS sku_code,
      s.barcode AS barcode,
      s.language AS language,
      s.country_code AS country_code,
      s.size_label AS size_label,
      pm.code AS material_code,
      pm.color AS material_color,
      pm.size AS material_size,
      pm.unit AS material_unit,
      pt.name AS part_name,
      pt.code AS part_code,
      pt.type AS part_type,
      pt.unit_of_measure AS part_unit
    FROM ${tableName}
    ${joins.join('\n')}
    WHERE ${whereClause}
    ORDER BY ${safeSortClause};
  `;

  try {
    const result = await paginateResults({
      dataQuery: queryText,
      params,
      page,
      limit,
      meta: {
        context:
          'warehouse-inventory-repository/getPaginatedWarehouseInventoryRecords',
      },
    });

    logSystemInfo('Fetched warehouse inventory records.', {
      context:
        'warehouse-inventory-repository/getPaginatedWarehouseInventoryRecords',
      page,
      limit,
      resultCount: result?.data?.length ?? 0,
    });

    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch warehouse inventory records.', {
      context:
        'warehouse-inventory-repository/getPaginatedWarehouseInventoryRecords',
    });

    throw AppError.databaseError('Failed to fetch warehouse inventory data.');
  }
};

/**
 * Inserts or updates warehouse inventory records in bulk.
 *
 * - Performs `ON CONFLICT DO UPDATE` on (warehouse_id, batch_id)
 * - Updates quantities, fees, status, and audit info
 * - Automatically fills missing values with sensible defaults
 * - Uses structured logging and standardized error handling
 *
 * @param {Array<Object>} records - Inventory records to insert or update
 * @param {Pool|Client} client - PostgreSQL client or pool
 * @param {Object} meta - Optional metadata for tracing/debugging
 * @returns {Promise<Array>} Inserted or updated row IDs
 * @throws {AppError} If the insert operation fails
 */
const insertWarehouseInventoryRecords = async (records, client, meta = {}) => {
  if (!Array.isArray(records) || records.length === 0) return [];

  const columns = [
    'warehouse_id',
    'batch_id',
    'warehouse_quantity',
    'warehouse_fee',
    'inbound_date',
    'outbound_date',
    'status_id',
    'created_by',
    'updated_at',
    'updated_by',
  ];

  const rows = records.map((r) => [
    r.warehouse_id,
    r.batch_id,
    Number.isFinite(r.warehouse_quantity) ? r.warehouse_quantity : 0,
    Number.isFinite(r.warehouse_fee) ? r.warehouse_fee : 0,
    r.inbound_date,
    null,
    r.status_id ?? getStatusIdByQuantity(r.warehouse_quantity),
    r.created_by ?? null,
    null,
    null,
  ]);

  const conflictColumns = ['warehouse_id', 'batch_id'];
  const updateStrategies = {
    warehouse_quantity: 'add',
    warehouse_fee: 'overwrite',
    status_id: 'overwrite',
    status_date: 'overwrite',
    last_update: 'overwrite',
    updated_at: 'overwrite',
    updated_by: 'overwrite',
  };

  try {
    return await bulkInsert(
      'warehouse_inventory',
      columns,
      rows,
      conflictColumns,
      updateStrategies,
      client,
      meta,
      'id AS warehouse_inventory_id'
    );
  } catch (error) {
    logSystemException(error, 'Failed to insert warehouse inventory records', {
      context: 'warehouse-inventory-repository/insertWarehouseInventoryRecords',
      meta,
    });

    throw AppError.databaseError(
      'Unable to insert/update warehouse inventory records',
      {
        details: { table: 'warehouse_inventory', count: records.length },
      }
    );
  }
};

/**
 * Fetches enriched warehouse inventory records for response payloads.
 *
 * Used after insert or update operations (e.g., adjustments).
 * Provides essential data for confirmation or UI display.
 *
 * Supports:
 * - Product and packaging material batches
 * - Lot number, expiry date, name, SKU, and quantity fields
 *
 * @param {string[]} ids - Warehouse inventory UUIDs
 * @param {object} client - PostgreSQL client or pool
 * @returns {Promise<Array<Object>>} Lightweight enriched inventory records
 */
const getWarehouseInventoryResponseByIds = async (ids, client) => {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');

  const sql = `
    SELECT
      wi.id,
      wi.warehouse_quantity,
      wi.reserved_quantity,
      br.batch_type,
      pb.lot_number AS product_lot_number,
      pb.expiry_date AS product_expiry_date,
      p.name AS product_name,
      p.brand,
      s.sku,
      s.country_code,
      s.size_label,
      pmb.lot_number AS material_lot_number,
      pmb.expiry_date AS material_expiry_date,
      pmb.material_snapshot_name AS material_name
    FROM warehouse_inventory wi
    JOIN batch_registry br ON wi.batch_id = br.id
    LEFT JOIN product_batches pb ON br.product_batch_id = pb.id
    LEFT JOIN skus s ON pb.sku_id = s.id
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id
    WHERE wi.id IN (${placeholders})
  `;

  try {
    const { rows } = await query(sql, ids, client);
    return rows;
  } catch (error) {
    logSystemException(
      error,
      'Error retrieving warehouse inventory response data by IDs',
      {
        context:
          'warehouse-inventory-repository/getWarehouseInventoryResponseByIds',
        ids,
      }
    );

    throw AppError.databaseError('Failed to retrieve inventory response data', {
      details: {
        ids,
        error: error.message,
      },
    });
  }
};

/**
 * Performs a bulk update of warehouse quantities in the `warehouse_inventory` table.
 *
 * Each update is keyed by a composite key string in the format `'warehouseId-batchId'`,
 * and contains values to update such as `warehouse_quantity`, `status_id`, and `last_update`.
 *
 * Example:
 * {
 *   '9d0ae78c-7885-4002-921c-9481ff74d137-c5471be9-340d-4b3c-b4be-f69dd9561bf1': {
 *     warehouse_quantity: 100,
 *     status_id: '2a6c3b91-aaaa-bbbb-cccc-1234567890ab',
 *     last_update: '2025-06-02T10:00:00Z'
 *   }
 * }
 *
 * @param {Record<string, { warehouse_quantity: number, status_id: string, last_update: string }>} updates
 *   A map where each key is a composite of `warehouse_id-batch_id`, and the value contains the update payload.
 *
 * @param {string} userId - The UUID of the user performing the update (used to populate `updated_by`).
 * @param {import('pg').PoolClient} client - A PostgreSQL client instance from the `pg` library.
 *
 * @returns {Promise<Array<{ warehouse_id: string, batch_id: string }>>}
 *   Resolves with an array of the updated composite keys.
 */
const bulkUpdateWarehouseQuantities = async (updates, userId, client) => {
  const table = 'warehouse_inventory';
  const columns = [
    'warehouse_quantity',
    'reserved_quantity',
    'status_id',
    'last_update',
  ];
  const whereColumns = ['warehouse_id', 'batch_id'];
  const columnTypes = {
    warehouse_quantity: 'integer',
    reserved_quantity: 'integer',
    status_id: 'uuid',
    last_update: 'timestamptz',
  };

  try {
    const queryData = formatBulkUpdateQuery(
      table,
      columns,
      whereColumns,
      updates,
      userId,
      columnTypes
    );

    if (!queryData) return [];

    const { baseQuery, params } = queryData;
    const result = await query(baseQuery, params, client);

    return result.rows;
  } catch (error) {
    const message = 'Failed to bulk update warehouse quantities';

    logSystemException(error, message, {
      context: 'warehouse-inventory-repository/bulkUpdateWarehouseQuantities',
      updates,
      userId,
    });
    throw AppError.databaseError(message, {
      updates,
      userId,
    });
  }
};

/**
 * Fetches multiple `warehouse_inventory` rows using composite keys (`warehouse_id`, `batch_id`).
 *
 * For each input pair, attempts to retrieve the corresponding inventory record from the database.
 * If any expected records are missing, a system warning will be logged.
 * This function is useful when verifying current stock and reservation state across multiple batches.
 *
 * Logs:
 * - Warns when one or more requested rows are not found.
 * - Logs structured exception info on query failure.
 *
 * @param {Array<{ warehouse_id: string, batch_id: string }>} keys - Composite keys to fetch.
 * @param {import('pg').PoolClient} client - PostgreSQL client used for the transaction.
 * @returns {Promise<Array<{
 *   id: string,
 *   warehouse_id: string,
 *   batch_id: string,
 *   warehouse_quantity: number,
 *   reserved_quantity: number,
 *   status_id: string
 * }>>} - Matching inventory records.
 *
 * @throws {AppError} - If a database error occurs.
 */
const getWarehouseInventoryQuantities = async (keys, client) => {
  const sql = `
    SELECT id, warehouse_id, batch_id, warehouse_quantity, reserved_quantity, status_id
    FROM warehouse_inventory
    WHERE ${keys
      .map(
        (_, i) => `(warehouse_id = $${i * 2 + 1} AND batch_id = $${i * 2 + 2})`
      )
      .join(' OR ')}
  `;
  const params = keys.flatMap(({ warehouse_id, batch_id }) => [
    warehouse_id,
    batch_id,
  ]);

  try {
    const result = await query(sql, params, client);

    if (result.rows.length !== keys.length) {
      const missingKeys = keys.filter(
        ({ warehouse_id, batch_id }) =>
          !result.rows.some(
            (row) =>
              row.warehouse_id === warehouse_id && row.batch_id === batch_id
          )
      );
      logSystemWarn('Missing warehouse_inventory records detected', {
        context:
          'warehouse-inventory-repository/getWarehouseInventoryQuantities',
        missingKeys,
        expected: keys.length,
        found: result.rows.length,
      });
    }

    if (result.rows.length !== keys.length) {
      logSystemWarn('Some warehouse_inventory records not found', {
        context:
          'warehouse-inventory-repository/getWarehouseInventoryQuantities',
        expected: keys.length,
        found: result.rows.length,
      });
    }

    return result.rows;
  } catch (error) {
    logSystemException(
      error,
      'Failed to fetch multiple warehouse_inventory records',
      {
        context:
          'warehouse-inventory-repository/getWarehouseInventoryQuantities',
        keys,
      }
    );
    throw AppError.databaseError('Failed to fetch warehouse inventory records');
  }
};

/**
 * Fetches allocatable batches from warehouse inventory based on SKU or packaging material filters.
 *
 * Applies allocation strategies like FIFO (first-in, first-out) or FEFO (first-expired, first-out),
 * and only returns batches with positive quantity and matching inventory status (e.g., "in_stock").
 *
 * @param {Object} allocationFilter - Filter criteria for the allocation query.
 * @param {UUID[]} allocationFilter.skuIds - List of SKU IDs to include.
 * @param {UUID[]} allocationFilter.packagingMaterialIds - List of packaging material IDs to include.
 * @param {UUID} allocationFilter.warehouseId - Warehouse ID to fetch batches from.
 * @param {UUID} allocationFilter.inventoryStatusId - Inventory status ID to filter by (e.g., "in_stock").
 *
 * @param {Object} [options={}] - Optional configuration for sorting and strategy.
 * @param {'fifo'|'fefo'} [options.strategy] - Allocation strategy to apply (sorts by `inbound_date` or `expiry_date`).
 *
 * @param {Object} [client] - Optional database client for transactional context.
 *
 * @returns {Promise<Array>} Resolves to an array of allocatable batch records.
 *
 * @throws {AppError} If the database query fails.
 */
const getAllocatableBatchesByWarehouse = async (
  allocationFilter = {},
  options = {},
  client
) => {
  const {
    skuIds = [],
    packagingMaterialIds = [],
    warehouseId,
    inventoryStatusId,
  } = allocationFilter;

  const orderByField =
    options.strategy === 'fefo'
      ? 'expiry_date'
      : options.strategy === 'fifo'
        ? 'inbound_date'
        : null;

  const orderByClause = orderByField ? `ORDER BY ${orderByField} ASC` : '';

  const sql = `
    SELECT
      wi.batch_id,
      wi.warehouse_id,
      wi.warehouse_quantity,
      wi.reserved_quantity,
      COALESCE(pb.expiry_date, pmb.expiry_date) AS expiry_date,
      br.batch_type,
      pb.sku_id,
      pm.id AS packaging_material_id
    FROM warehouse_inventory wi
    JOIN batch_registry br ON wi.batch_id = br.id
    LEFT JOIN product_batches pb ON br.product_batch_id = pb.id
    LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id
    LEFT JOIN packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id
    LEFT JOIN packaging_materials pm ON pms.packaging_material_id = pm.id
    WHERE wi.warehouse_id = $1
      AND wi.warehouse_quantity > 0
      AND wi.status_id = $2
      AND (
        (pb.sku_id = ANY($3::uuid[]) AND pb.sku_id IS NOT NULL)
        OR
        (pm.id = ANY($4::uuid[]) AND pm.id IS NOT NULL)
      )
    ${orderByClause}
  `;

  try {
    const result = await query(
      sql,
      [warehouseId, inventoryStatusId, skuIds, packagingMaterialIds],
      client
    );

    logSystemInfo('Fetched allocatable batches by warehouse', {
      context: 'inventory-repository/getAllocatableBatchesByWarehouse',
      warehouseId,
      skuCount: skuIds.length,
      packagingMaterialCount: packagingMaterialIds.length,
      strategy: options.strategy ?? 'none',
      rowCount: result?.rows?.length ?? 0,
      severity: 'INFO',
    });

    return result.rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch allocatable batches', {
      context: 'inventory-repository/getAllocatableBatchesByWarehouse',
      warehouseId,
      skuIds,
      packagingMaterialIds,
      strategy: options.strategy ?? 'none',
      severity: 'ERROR',
    });

    throw AppError.databaseError(
      'Unable to retrieve allocatable warehouse inventory.'
    );
  }
};

/**
 * Retrieves detailed inventory and lot-level data for a given warehouse.
 *
 * This includes inventory item info, lot number, quantities, expiry/manufacture dates,
 * statuses, and audit metadata (created/updated by).
 *
 * @param {Object} params - Parameters for fetching detailed records.
 * @param {string} params.warehouse_id - UUID of the warehouse.
 * @param {number} [params.page] - Page number for pagination (optional).
 * @param {number} [params.limit] - Number of records per page (optional).
 * @returns {Promise<Object>} - A paginated result of detailed warehouse inventory records.
 * @throws {AppError} - Throws a database error if the query fails.
 */
const getWarehouseInventoryDetailsByWarehouseId = async ({
  warehouse_id,
  page,
  limit,
}) => {
  const tableName = 'warehouse_inventory wi';

  const joins = [
    'JOIN warehouses w ON wi.warehouse_id = w.id',
    'JOIN inventory i ON wi.inventory_id = i.id',
    'LEFT JOIN products p ON i.product_id = p.id',
    'LEFT JOIN warehouse_inventory_lots wil ON wi.inventory_id = wil.inventory_id ' +
      'AND wi.warehouse_id = wil.warehouse_id ' +
      'AND (wi.warehouse_id = wil.warehouse_id OR wil.warehouse_id IS NULL)\n',
    'LEFT JOIN warehouse_lot_status ws ON wil.status_id = ws.id',
    'LEFT JOIN users u1 ON wi.created_by = u1.id',
    'LEFT JOIN users u2 ON wi.updated_by = u2.id',
    'LEFT JOIN users u3 ON wil.created_by = u3.id',
    'LEFT JOIN users u4 ON wil.updated_by = u4.id',
  ];

  const whereClause = 'wi.warehouse_id = $1';

  // Sorting
  const defaultSort =
    'COALESCE(i.product_id::TEXT, i.identifier), wil.lot_number, wil.expiry_date';

  const baseQuery = `
    SELECT
      wi.id AS warehouse_inventory_id,
      i.id AS inventory_id,
      COALESCE(NULLIF(p.product_name, ''), i.identifier) AS item_name,
      i.item_type,
      wil.id AS warehouse_inventory_lot_id,
      wil.lot_number,
      COALESCE(wil.quantity, 0) AS lot_quantity,
      COALESCE(wi.reserved_quantity, 0) AS reserved_stock,
      COALESCE(wil.reserved_quantity, 0) AS lot_reserved_quantity,
      (
        SELECT SUM(wil2.quantity - COALESCE(wil2.reserved_quantity, 0))
        FROM warehouse_inventory_lots wil2
        JOIN warehouse_lot_status wls2 ON wil2.status_id = wls2.id
        WHERE wil2.inventory_id = wi.inventory_id
          AND wil2.warehouse_id = wi.warehouse_id
          AND wls2.name = 'in_stock'
      ) AS available_stock,
      COALESCE(wi.warehouse_fee, 0) AS warehouse_fees,
      COALESCE(ws.name, 'Unknown') AS lot_status,
      wil.manufacture_date,
      wil.expiry_date,
      wil.inbound_date,
      wil.outbound_date,
      wi.last_update,
      wi.created_at AS inventory_created_at,
      wi.updated_at AS inventory_updated_at,
  
      COALESCE(u1.firstname, '') || ' ' || COALESCE(u1.lastname, 'Unknown') AS inventory_created_by,
      COALESCE(u2.firstname, '') || ' ' || COALESCE(u2.lastname, 'Unknown') AS inventory_updated_by,
  
      wil.created_at AS lot_created_at,
      wil.updated_at AS lot_updated_at,
      COALESCE(u3.firstname, '') || ' ' || COALESCE(u3.lastname, 'Unknown') AS lot_created_by,
      COALESCE(u4.firstname, '') || ' ' || COALESCE(u4.lastname, 'Unknown') AS lot_updated_by
    FROM ${tableName}
    ${joins.join(' ')}
    WHERE ${whereClause}
     GROUP BY
    wi.id, i.id, p.product_name, i.identifier, i.item_type,
    wil.id, wil.lot_number, wil.quantity, wi.reserved_quantity,
    wil.reserved_quantity, wi.warehouse_fee,
    ws.name, wil.manufacture_date, wil.expiry_date, wil.inbound_date, wil.outbound_date,
    wi.last_update, wi.created_at, wi.updated_at,
    u1.firstname, u1.lastname, u2.firstname, u2.lastname,
    wil.created_at, wil.updated_at,
    u3.firstname, u3.lastname, u4.firstname, u4.lastname
  `;

  try {
    // Use pagination if required
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: baseQuery,
        params: [warehouse_id],
        page,
        limit,
        sortBy: defaultSort,
        sortOrder: 'ASC',
      });
    });
  } catch (error) {
    logError(
      `Error fetching warehouse inventory details (page: ${page}, limit: ${limit}):`,
      error
    );
    throw AppError.databaseError(
      'Failed to fetch warehouse inventory details.'
    );
  }
};

/**
 * Checks the existence of inventory records in specified warehouses.
 *
 * @param {object} client - The database client instance.
 * @param {string[]} warehouseIds - An array of warehouse IDs.
 * @param {string[]} inventoryRecords - An array of inventory IDs.
 * @returns {Promise<Array<{warehouse_id: string, inventory_id: string, id: string}>>}
 *          - Returns an array of matching warehouse inventory records, or an empty array if none are found.
 * @throws {AppError} - Throws an error if the database query fails.
 */
const checkWarehouseInventoryBulk = async (
  client,
  warehouseIds,
  inventoryRecords
) => {
  if (
    !Array.isArray(warehouseIds) ||
    warehouseIds.length === 0 ||
    !Array.isArray(inventoryRecords) ||
    inventoryRecords.length === 0
  ) {
    return [];
  }

  const queryText = `
    SELECT warehouse_id, inventory_id, id
    FROM warehouse_inventory
    WHERE warehouse_id = ANY($1::uuid[])
    AND inventory_id = ANY($2::uuid[]);
  `;

  try {
    const { rows } = await client.query(queryText, [
      warehouseIds,
      inventoryRecords,
    ]);
    return rows;
  } catch (error) {
    logError('Error checking warehouse inventory existence:', error);
    throw AppError.databaseError('Database query failed');
  }
};

/**
 * Retrieves recently inserted warehouse inventory records based on warehouse lot IDs.
 *
 * @param {string[]} warehouseLotIds - An array of warehouse lot IDs.
 * @returns {Promise<Array<{
 *   warehouse_id: string,
 *   warehouse_name: string,
 *   total_records: number,
 *   inventory_records: Array<{
 *     warehouse_lot_id: string,
 *     inventory_id: string,
 *     location_id: string,
 *     quantity: number,
 *     product_name: string,
 *     identifier: string,
 *     inserted_quantity: number,
 *     available_quantity: number,
 *     lot_number: string,
 *     expiry_date: string | null,
 *     manufacture_date: string | null,
 *     inbound_date: string | null,
 *     inventory_created_at: string,
 *     inventory_created_by: string,
 *     inventory_updated_at: string,
 *     inventory_updated_by: string
 *   }>
 * }>>} - Returns an array of warehouse inventory records, grouped by warehouse, including product and lot details.
 * @throws {Error} - Throws an error if the database query fails.
 */
const getRecentInsertWarehouseInventoryRecords = async (warehouseLotIds) => {
  const queryText = `
    WITH lots_data AS (
      SELECT
        wil.id AS warehouse_lot_id,
        wil.warehouse_id,
        wil.inventory_id,
        i.location_id,
        i.quantity AS inventory_qty,
        wil.quantity AS lot_qty,
        wil.reserved_quantity AS reserved_qty,
        wil.lot_number,
        wil.expiry_date,
        wil.manufacture_date,
        wil.created_at AS lot_created_at,
        COALESCE(u1.firstname, '') || ' ' || COALESCE(u1.lastname, 'Unknown') AS lot_created_by,
        wil.updated_at AS lot_updated_at,
        COALESCE(u2.firstname, '') || ' ' || COALESCE(u2.lastname, 'Unknown') AS lot_updated_by,
        wi.available_quantity,
        p.product_name,
        i.identifier,
        i.product_id
      FROM warehouse_inventory_lots wil
      JOIN inventory i ON wil.inventory_id = i.id
      JOIN warehouse_inventory wi ON wil.inventory_id = wi.inventory_id
                                   AND wil.warehouse_id = wi.warehouse_id
      LEFT JOIN users u1 ON wil.created_by = u1.id
      LEFT JOIN users u2 ON wil.updated_by = u2.id
      LEFT JOIN products p ON i.product_id = p.id
      WHERE wil.id = ANY($1::uuid[])
    )
    SELECT
      w.id AS warehouse_id,
      w.name AS warehouse_name,
      COUNT(ld.warehouse_lot_id) AS total_records,
      json_agg(
        jsonb_strip_nulls(
          jsonb_build_object(
            'warehouse_lot_id', ld.warehouse_lot_id,
            'inventory_id', ld.inventory_id,
            'location_id', ld.location_id,
            'inventory_qty', ld.inventory_qty,
            'lot_qty', ld.lot_qty,
            'lot_reserved_quantity', ld.reserved_qty,
            'inserted_quantity', i.quantity,
            'available_quantity', ld.available_quantity,
            'lot_number', ld.lot_number,
            'expiry_date', ld.expiry_date,
            'manufacture_date', ld.manufacture_date,
            'inbound_date', i.inbound_date,
            'lot_created_at', ld.lot_created_at,
            'lot_created_by', ld.lot_created_by,
            'lot_updated_at', ld.lot_updated_at,
            'lot_updated_by', ld.lot_updated_by
          ) ||
          CASE
            WHEN ld.product_id IS NOT NULL
              THEN jsonb_build_object('product_name', ld.product_name)
            ELSE jsonb_build_object('identifier', COALESCE(ld.identifier, 'Unknown Item'))
          END
        )
      ) AS inventory_records
    FROM lots_data ld
    JOIN warehouses w ON ld.warehouse_id = w.id
    JOIN inventory i ON ld.inventory_id = i.id
    GROUP BY w.id, w.name;
  `;

  try {
    const { rows } = await query(queryText, [warehouseLotIds]);
    return rows;
  } catch (error) {
    logError('Error executing inventory query:', error);
    throw error;
  }
};

module.exports = {
  getPaginatedWarehouseInventoryItemSummary,
  getWarehouseInventorySummaryDetailsByItemId,
  getPaginatedWarehouseInventoryRecords,
  insertWarehouseInventoryRecords,
  getWarehouseInventoryResponseByIds,
  bulkUpdateWarehouseQuantities,
  getWarehouseInventoryQuantities,
  getAllocatableBatchesByWarehouse,
  getWarehouseInventoryDetailsByWarehouseId,
  checkWarehouseInventoryBulk,
  getRecentInsertWarehouseInventoryRecords,
};

const {
  query,
  paginateResults,
  bulkInsert,
  formatBulkUpdateQuery,
} = require('../database/db');
const AppError = require('../utils/AppError');
const {
  logSystemException,
  logSystemInfo,
  logSystemWarn,
} = require('../utils/system-logger');
const {
  buildLocationInventoryWhereClause,
} = require('../utils/sql/build-location-inventory-filters');
const {
  getStatusIdByQuantity,
} = require('../utils/query/inventory-query-utils');

/**
 * Fetches summarized KPI statistics for location inventory, grouped by item type.
 *
 * - Returns counts of products, materials, quantities, expired/near-expiry items, and stock status.
 * - Supports optional filtering by item type (`'product'` or `'packaging_material'`).
 * - If no `itemType` is provided, includes a total row in addition to grouped data.
 *
 * @param {Object} options - Query options.
 * @param {'product' | 'packaging_material'} [options.itemType] - Optional filter to limit results by item type.
 * @returns {Promise<Array>} An array of summary objects, grouped by item type and a total row if no filter is applied.
 */
const getLocationInventoryKpiSummary = async ({ itemType } = {}) => {
  const filterCondition = itemType ? `WHERE br.batch_type = '${itemType}'` : '';

  const queryText = `
    SELECT
      br.batch_type::text AS batch_type,
      COUNT(DISTINCT CASE WHEN br.batch_type = 'product' THEN s.id END) AS total_products,
      COUNT(DISTINCT CASE WHEN br.batch_type = 'packaging_material' THEN pm.id END) AS total_materials,
      COUNT(DISTINCT l.id) AS locations_count,
      SUM(li.location_quantity) AS total_quantity,
      SUM(li.reserved_quantity) AS total_reserved,
      SUM(li.location_quantity - li.reserved_quantity) AS total_available,
      COUNT(*) FILTER (
        WHERE (
          (br.batch_type = 'product' AND pb.expiry_date BETWEEN NOW() AND NOW() + INTERVAL '90 days') OR
          (br.batch_type = 'packaging_material' AND pmb.expiry_date BETWEEN NOW() AND NOW() + INTERVAL '90 days')
        )
      ) AS near_expiry_inventory_records,
      COUNT(*) FILTER (
        WHERE (
          (br.batch_type = 'product' AND pb.expiry_date < NOW()) OR
          (br.batch_type = 'packaging_material' AND pmb.expiry_date < NOW())
        )
      ) AS expired_inventory_records,
      COUNT(DISTINCT pb.id) FILTER (
        WHERE br.batch_type = 'product' AND pb.expiry_date < NOW()
      ) AS expired_product_batches,
      COUNT(DISTINCT pmb.id) FILTER (
        WHERE br.batch_type = 'packaging_material' AND pmb.expiry_date < NOW()
      ) AS expired_material_batches,
      COUNT(*) FILTER (WHERE li.location_quantity < 10) AS low_stock_count
    FROM location_inventory li
    JOIN batch_registry br ON li.batch_id = br.id
    LEFT JOIN product_batches pb ON br.product_batch_id = pb.id
    LEFT JOIN skus s ON pb.sku_id = s.id
    LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id
    LEFT JOIN packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id
    LEFT JOIN packaging_materials pm ON pms.packaging_material_id = pm.id
    JOIN locations l ON li.location_id = l.id
    ${filterCondition}
    GROUP BY br.batch_type

    ${
      itemType
        ? ''
        : `
    UNION ALL

    SELECT
      'total' AS batch_type,
      COUNT(DISTINCT CASE WHEN br.batch_type = 'product' THEN s.id END),
      COUNT(DISTINCT CASE WHEN br.batch_type = 'packaging_material' THEN pm.id END),
      COUNT(DISTINCT l.id),
      SUM(li.location_quantity),
      SUM(li.reserved_quantity),
      SUM(li.location_quantity - li.reserved_quantity),
      COUNT(*) FILTER (
        WHERE (
          (br.batch_type = 'product' AND pb.expiry_date BETWEEN NOW() AND NOW() + INTERVAL '90 days') OR
          (br.batch_type = 'packaging_material' AND pmb.expiry_date BETWEEN NOW() AND NOW() + INTERVAL '90 days')
        )
      ),
      COUNT(*) FILTER (
        WHERE (
          (br.batch_type = 'product' AND pb.expiry_date < NOW()) OR
          (br.batch_type = 'packaging_material' AND pmb.expiry_date < NOW())
        )
      ),
      COUNT(DISTINCT pb.id) FILTER (WHERE br.batch_type = 'product' AND pb.expiry_date < NOW()),
      COUNT(DISTINCT pmb.id) FILTER (WHERE br.batch_type = 'packaging_material' AND pmb.expiry_date < NOW()),
      COUNT(*) FILTER (WHERE li.location_quantity < 10)
    FROM location_inventory li
    JOIN batch_registry br ON li.batch_id = br.id
    LEFT JOIN product_batches pb ON br.product_batch_id = pb.id
    LEFT JOIN skus s ON pb.sku_id = s.id
    LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id
    LEFT JOIN packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id
    LEFT JOIN packaging_materials pm ON pms.packaging_material_id = pm.id
    JOIN locations l ON li.location_id = l.id
    `
    }
  `;
  try {
    logSystemInfo('Fetching location inventory KPI stats', {
      context: 'location-inventory-repository/getLocationInventoryKPIStats',
      itemType,
    });
    const { rows } = await query(queryText);
    return rows;
  } catch (error) {
    logSystemException(error, 'Error fetching location inventory KPI stats', {
      context: 'location-inventory-repository/getLocationInventoryKPIStats',
    });
    throw AppError.databaseError(
      'Failed to fetch location inventory KPI stats'
    );
  }
};

/**
 * Fetches high-level location inventory records with support for:
 * pagination, dynamic filters, and sorting.
 *
 * Handles both product-based and packaging material–based inventory entries.
 * Applies system-defined filters (e.g., non-zero quantity) and user-provided filters
 * such as SKU, lot number, product/material name, dates, and status.
 *
 * @param {Object} options - Query parameters
 * @param {number} [options.page=1] - Current page number (1-based)
 * @param {number} [options.limit=10] - Number of records per page
 * @param {Object} [options.filters={}] - Filtering options
 * @param {string} [options.sortBy='createdAt'] - Field key to sort by (mapped internally to SQL column)
 * @param {string} [options.sortOrder='DESC'] - Sorting order: ASC or DESC
 *
 * @returns {Promise<{ data: Array<Object>, pagination: { page: number, limit: number, totalRecords: number, totalPages: number } }>}
 * Returns paginated inventory rows and metadata.
 */
const getHighLevelLocationInventorySummary = async ({
  page = 1,
  limit = 10,
  filters = {},
  sortBy = 'expiryDate',
  sortOrder = 'DESC',
} = {}) => {
  const joins = [
    'LEFT JOIN locations l ON li.location_id = l.id',
    'LEFT JOIN batch_registry br ON li.batch_id = br.id',
    'LEFT JOIN product_batches pb ON br.product_batch_id = pb.id',
    'LEFT JOIN skus s ON pb.sku_id = s.id',
    'LEFT JOIN products p ON s.product_id = p.id',
    'LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id',
    'LEFT JOIN packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id',
    'LEFT JOIN packaging_materials pm ON pms.packaging_material_id = pm.id',
  ];

  const { whereClause, params } = buildLocationInventoryWhereClause(filters);

  const tableName = 'location_inventory li';

  const queryText = `
    SELECT
      CASE
        WHEN br.batch_type = 'product' THEN s.id
        WHEN br.batch_type = 'packaging_material' THEN pm.id
        ELSE NULL
      END AS item_id,
      br.batch_type AS item_type,
      CASE
        WHEN br.batch_type = 'product' THEN s.country_code
        ELSE NULL
      END AS country_code,
      CASE
        WHEN br.batch_type = 'product' THEN s.size_label
        ELSE NULL
      END AS size_label,
      CASE
        WHEN br.batch_type = 'product' THEN s.sku
        ELSE NULL
      END AS sku,
      CASE
        WHEN br.batch_type = 'product' THEN p.name
        ELSE NULL
      END AS product_name,
      CASE
        WHEN br.batch_type = 'packaging_material' THEN pmb.material_snapshot_name
        ELSE NULL
      END AS material_name,
      COUNT(DISTINCT li.batch_id) AS total_lots,
      SUM(li.location_quantity) AS total_quantity,
      SUM(li.location_quantity - li.reserved_quantity) AS available_quantity,
      SUM(li.reserved_quantity) AS reserved_quantity,
      MIN(
        CASE
          WHEN br.batch_type = 'product' THEN pb.manufacture_date
          WHEN br.batch_type = 'packaging_material' THEN pmb.manufacture_date
          ELSE NULL
        END
      ) AS earliest_manufacture_date,
      MIN(
        CASE
          WHEN br.batch_type = 'product' THEN pb.expiry_date
          WHEN br.batch_type = 'packaging_material' THEN pmb.expiry_date
          ELSE NULL
        END
      ) AS nearest_expiry_date,
      MAX(li.created_at) AS created_at
    FROM ${tableName}
    ${joins.join('\n')}
    WHERE ${whereClause}
    GROUP BY
      br.batch_type,
      s.id, p.id,
      pm.id, pmb.material_snapshot_name
  `;

  try {
    logSystemInfo('Fetching location inventory summary', {
      context:
        'location-inventory-repository/getHighLevelLocationInventorySummary',
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return await paginateResults({
      dataQuery: queryText,
      params,
      page,
      limit,
      meta: {
        context:
          'location-inventory-repository/getHighLevelLocationInventorySummary',
        filters,
      },
    });
  } catch (error) {
    logSystemException(error, 'Error fetching location inventory summary', {
      context:
        'location-inventory-repository/getHighLevelLocationInventorySummary',
      filters,
    });
    throw AppError.databaseError('Failed to fetch location inventory summary');
  }
};

/**
 * Fetch enriched location inventory summary details for a given item ID (product SKU or packaging material).
 *
 * @param {Object} options
 * @param {number} options.page - The current page number for pagination.
 * @param {number} options.limit - The number of records per page.
 * @param {string} options.itemId - The SKU ID (for products) or the Material ID (for packaging materials).
 * @returns {Promise<Array>} A paginated array of location inventory summary detail records, including batch and location info.
 * @throws {AppError} If the database query fails.
 */
const getLocationInventorySummaryDetailsByItemId = async ({
  page,
  limit,
  itemId,
}) => {
  const queryText = `
    SELECT
      li.id AS location_inventory_id,
      br.batch_type,
      s.id AS sku_id,
      s.sku,
      p.name AS product_name,
      pm.id AS material_id,
      pm.code AS material_code,
      pm.name AS material_name,
      CASE
        WHEN br.batch_type = 'product' THEN pb.lot_number
        WHEN br.batch_type = 'packaging_material' THEN pmb.lot_number
        ELSE NULL
      END AS lot_number,
      pb.manufacture_date AS product_manufacture_date,
      pb.expiry_date AS product_expiry_date,
      pmb.manufacture_date AS material_manufacture_date,
      pmb.expiry_date AS material_expiry_date,
      li.location_quantity,
      li.reserved_quantity,
      li.inbound_date,
      li.outbound_date,
      li.last_update,
      li.status_id,
      ist.name AS status_name,
      li.status_date,
      l.id AS location_id,
      l.name AS location_name,
      lt.name AS location_type
    FROM location_inventory li
    JOIN locations l ON li.location_id = l.id
    JOIN location_types lt ON l.location_type_id = lt.id
    JOIN batch_registry br ON li.batch_id = br.id
    LEFT JOIN product_batches pb ON br.product_batch_id = pb.id
    LEFT JOIN skus s ON pb.sku_id = s.id
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id
    LEFT JOIN packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id
    LEFT JOIN packaging_materials pm ON pms.packaging_material_id = pm.id
    JOIN inventory_status ist ON li.status_id = ist.id
    WHERE
      (
        (br.batch_type = 'product' AND s.id = $1)
        OR
        (br.batch_type = 'packaging_material' AND pm.id = $1)
      )
    ORDER BY li.last_update DESC;
  `;

  try {
    const result = await paginateResults({
      dataQuery: queryText,
      params: [itemId],
      page,
      limit,
      meta: {
        context:
          'location-inventory-repository/getHighLevelLocationInventorySummary',
      },
    });

    logSystemInfo('Fetched location inventory summary successfully', {
      context:
        'location-inventory-repository/getLocationInventorySummaryDetailsByItemId',
      itemId,
      page,
      limit,
      resultCount: result?.data?.length ?? 0,
    });

    return result;
  } catch (error) {
    logSystemException(
      error,
      'Failed to fetch location inventory summary details',
      {
        context:
          'location-inventory-repository/getLocationInventorySummaryDetailsByItemId',
        itemId,
        page,
        limit,
      }
    );
    throw AppError.databaseError(
      'Error fetching location inventory summary details by item ID'
    );
  }
};

/**
 * Fetches paginated and enriched location inventory records.
 *
 * This query joins related metadata from multiple tables such as
 * - Location and location type
 * - Inventory status
 * - Product, SKU, manufacturer
 * - Packaging material, material supplier, parts
 * - Created/updated usernames
 *
 * It supports dynamic filtering, sorting, and pagination.
 *
 * @param {Object} options - Query configuration object
 * @param {number} options.page - Current page number (1-based)
 * @param {number} options.limit - Number of records per page
 * @param {Object} [options.filters] - Optional filters for narrowing the result set
 * @param {string} [options.safeSortClause] - A pre-sanitized SQL ORDER BY clause
 *
 * @returns {Promise<{
 *   data: Array<Object>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }>} Paginated location inventory data with enriched metadata
 */
const getPaginatedLocationInventoryRecords = async ({
  page,
  limit,
  filters,
  safeSortClause,
}) => {
  const tableName = 'location_inventory li';

  const joins = [
    'LEFT JOIN locations loc ON li.location_id = loc.id',
    'LEFT JOIN location_types lt ON loc.location_type_id = lt.id',
    'LEFT JOIN inventory_status st ON li.status_id = st.id',
    'LEFT JOIN users uc ON li.created_by = uc.id',
    'LEFT JOIN users uu ON li.updated_by = uu.id',
    'LEFT JOIN batch_registry br ON li.batch_id = br.id',
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

  const { whereClause, params } = buildLocationInventoryWhereClause(filters);

  const queryText = `
    SELECT
      li.id AS location_inventory_id,
      br.batch_type AS item_type,
      li.location_id,
      loc.name AS location_name,
      lt.name AS location_type_name,
      li.location_quantity,
      li.reserved_quantity,
      li.inbound_date,
      li.outbound_date,
      li.last_update,
      li.created_at,
      li.updated_at,
      st.name AS status_name,
      li.status_date,
      uc.firstname AS created_by_firstname,
      uc.lastname AS created_by_lastname,
      uu.firstname AS updated_by_firstname,
      uu.lastname AS updated_by_lastname,
      mfp.name AS product_manufacturer_name,
      sup.name AS material_supplier_name,
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
          'location-inventory-repository/getPaginatedLocationInventoryRecords',
      },
    });

    logSystemInfo('Fetched location inventory records.', {
      context:
        'location-inventory-repository/getPaginatedLocationInventoryRecords',
      page,
      limit,
      resultCount: result?.data?.length ?? 0,
    });

    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch location inventory records.', {
      context:
        'location-inventory-repository/getPaginatedLocationInventoryRecords',
    });

    throw AppError.databaseError('Failed to fetch location inventory data.');
  }
};

/**
 * Inserts or upserts multiple location_inventory records in bulk.
 *
 * - Uses conflict handling to update records when (location_id, batch_id) already exists.
 * - Assumes all quantities are validated before calling.
 * - Logs and throws on failure.
 *
 * @param {Array<Object>} records - Array of location_inventory record objects.
 * @param {object} client - Knex transaction or client instance.
 * @param {Object} meta - Optional metadata for tracing/debugging
 * @returns {Promise<number>} Number of rows inserted or updated.
 * @throws {AppError} On failure.
 */
const insertLocationInventoryRecords = async (records, client, meta) => {
  if (!Array.isArray(records) || records.length === 0) return 0;

  const columns = [
    'batch_id',
    'location_id',
    'location_quantity',
    'inbound_date',
    'outbound_date',
    'status_id',
    'updated_at',
    'created_by',
    'updated_by',
  ];

  const rows = records.map((r) => [
    r.batch_id ?? null,
    r.location_id,
    Number.isFinite(r.location_quantity) ? r.location_quantity : 0,
    r.inbound_date,
    null,
    r.status_id ?? getStatusIdByQuantity(r.location_quantity),
    null,
    r.created_by ?? null,
    null,
  ]);

  const conflictColumns = ['location_id', 'batch_id'];
  const updateStrategies = {
    location_quantity: 'add',
    status_id: 'overwrite',
    status_date: 'overwrite',
    last_update: 'overwrite',
    updated_at: 'overwrite',
    updated_by: 'overwrite',
  };

  try {
    return await bulkInsert(
      'location_inventory',
      columns,
      rows,
      conflictColumns,
      updateStrategies,
      client,
      meta,
      'id AS location_inventory_id'
    );
  } catch (error) {
    logSystemException(
      error,
      'Failed to bulk insert location_inventory records',
      {
        context: 'location-inventory-repository/insertLocationInventoryRecords',
        count: records.length,
      }
    );

    throw AppError.databaseError(
      'Unable to insert/update location inventory records',
      {
        details: { table: 'location_inventory', count: records.length },
      }
    );
  }
};

/**
 * Retrieves enriched location inventory response data by IDs.
 *
 * Used to construct API responses after insert or quantity adjustment operations.
 * Returns minimal yet informative fields for confirmation or UI display.
 *
 * - Supports both product and material batches via `batch_type`.
 * - Includes basic product/material, lot, and expiry details.
 *
 * @param {string[]} ids - Array of location_inventory UUIDs.
 * @param {object} client - PostgreSQL client or pool instance.
 * @returns {Promise<Array<Object>>} - Enriched location inventory response data.
 */
const getLocationInventoryResponseByIds = async (ids, client) => {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');

  const sql = `
    SELECT
      li.id,
      li.location_quantity,
      li.reserved_quantity,
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
    FROM location_inventory li
    JOIN batch_registry br ON li.batch_id = br.id
    LEFT JOIN product_batches pb ON br.product_batch_id = pb.id
    LEFT JOIN skus s ON pb.sku_id = s.id
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id
    WHERE li.id IN (${placeholders})
  `;

  try {
    const { rows } = await query(sql, ids, client);
    return rows;
  } catch (error) {
    logSystemException(
      error,
      'Error retrieving location inventory response data by IDs',
      {
        context:
          'location-inventory-repository/getLocationInventoryResponseByIds',
        ids,
      }
    );

    throw AppError.databaseError(
      'Failed to retrieve location inventory response data',
      {
        details: {
          ids,
          error: error.message,
        },
      }
    );
  }
};

/**
 * Performs a bulk update of location quantities in the `location_inventory` table.
 *
 * Each update is keyed by a composite key string in the format `'locationId-batchId'`,
 * and contains values to update such as `location_quantity`, `status_id`, and `last_update`.
 *
 * @param {Record<string, { location_quantity: number, status_id: string, last_update: string }>} updates
 * @param {string} userId - The UUID of the user performing the update.
 * @param {import('pg').PoolClient} client - A PostgreSQL client instance.
 * @returns {Promise<Array<{ location_id: string, batch_id: string }>>}
 */
const bulkUpdateLocationQuantities = async (updates, userId, client) => {
  const table = 'location_inventory';
  const columns = ['location_quantity', 'status_id', 'last_update'];
  const whereColumns = ['location_id', 'batch_id'];
  const columnTypes = {
    location_quantity: 'integer',
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
    const message = 'Failed to bulk update location quantities';
    logSystemException(error, message, {
      context: 'location-inventory-repository/bulkUpdateLocationQuantities',
      updates,
      userId,
    });
    throw AppError.databaseError(message, { updates, userId });
  }
};

/**
 * Fetches multiple location_inventory rows by composite keys.
 *
 * @param {Array<{ location_id: string, batch_id: string }>} keys - List of composite keys.
 * @param {import('pg').PoolClient} client - pg client instance.
 * @returns {Promise<Array<{ id: string, location_id: string, batch_id: string, location_quantity: number, reserved_quantity: number, status_id: string }>>}
 */
const getLocationInventoryQuantities = async (keys, client) => {
  const sql = `
    SELECT id, location_id, batch_id, location_quantity, reserved_quantity, status_id
    FROM location_inventory
    WHERE ${keys
      .map(
        (_, i) => `(location_id = $${i * 2 + 1} AND batch_id = $${i * 2 + 2})`
      )
      .join(' OR ')}
  `;
  const params = keys.flatMap(({ location_id, batch_id }) => [
    location_id,
    batch_id,
  ]);

  try {
    const result = await query(sql, params, client);

    if (result.rows.length !== keys.length) {
      const missingKeys = keys.filter(
        ({ location_id, batch_id }) =>
          !result.rows.some(
            (row) =>
              row.location_id === location_id && row.batch_id === batch_id
          )
      );
      logSystemWarn('Missing location_inventory records detected', {
        context: 'location-inventory-repository/getLocationInventoryQuantities',
        missingKeys,
        expected: keys.length,
        found: result.rows.length,
      });
    }

    return result.rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch location_inventory records', {
      context: 'location-inventory-repository/getLocationInventoryQuantities',
      keys,
    });
    throw AppError.databaseError('Failed to fetch location inventory records');
  }
};

module.exports = {
  getLocationInventoryKpiSummary,
  getHighLevelLocationInventorySummary,
  getLocationInventorySummaryDetailsByItemId,
  getPaginatedLocationInventoryRecords,
  insertLocationInventoryRecords,
  getLocationInventoryResponseByIds,
  bulkUpdateLocationQuantities,
  getLocationInventoryQuantities,
};

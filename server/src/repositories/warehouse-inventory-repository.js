const {
  query,
  paginateQuery,
  retry,
  bulkInsert,
  lockRows,
  formatBulkUpdateQuery, paginateResults,
} = require('../database/db');
const AppError = require('../utils/AppError');
const {
  logSystemError,
  logSystemInfo
} = require('../utils/system-logger');
const { logError } = require('../utils/logger-helper');

/**
 * Fetches a paginated summary of inventory data grouped by SKU.
 *
 * This function uses `warehouse_inventory` as the source of truth and aggregates:
 * - total inventory entries
 * - recorded vs. actual quantity
 * - available and reserved quantity
 * - earliest manufacture date and nearest expiry date
 * - system-level stock status (e.g., in_stock, expired)
 *
 * SKUs and Products must match the provided `statusId` (usually 'active').
 * Results are ordered by stock priority, then item name, then quantity.
 *
 * @param {Object} options
 * @param {number} [options.page=1] - The page number for pagination.
 * @param {number} [options.limit=20] - The number of items per page.
 * @param {string} options.statusId - The UUID of the 'active' status to filter by.
 * @returns {Promise<{ data: any[], meta: { page: number, total: number } }>} A paginated summary of SKU-level inventory data.
 */
const getPaginatedSkuInventorySummary = async ({ page = 1, limit = 20, statusId }) => {
  const baseQuery = `
    WITH lot_agg AS (
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
    status_priority AS (
      SELECT
        pb.sku_id,
        MIN(CASE ist.name
          WHEN 'expired' THEN 1
          WHEN 'suspended' THEN 2
          WHEN 'unavailable' THEN 3
          WHEN 'out_of_stock' THEN 4
          WHEN 'in_stock' THEN 5
          ELSE 6
        END) AS min_priority
      FROM warehouse_inventory wi
      JOIN batch_registry br ON wi.batch_id = br.id
      JOIN product_batches pb ON br.product_batch_id = pb.id
      JOIN inventory_status ist ON wi.status_id = ist.id
      GROUP BY pb.sku_id
    ),
    status_names AS (
      SELECT * FROM (
        VALUES
          (1, 'expired'),
          (2, 'suspended'),
          (3, 'unavailable'),
          (4, 'out_of_stock'),
          (5, 'in_stock'),
          (6, 'unassigned')
      ) AS s(priority, name)
    )
    
    SELECT
      s.id AS sku_id,
      s.country_code,
      s.size_label,
      s.sku,
      p.brand,
      COALESCE(NULLIF(p.name, ''), s.sku) AS product_name,
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
      COALESCE(sn.name, 'unassigned') AS display_status
    FROM warehouse_inventory wi
    JOIN batch_registry br ON wi.batch_id = br.id
    JOIN product_batches pb ON br.product_batch_id = pb.id
    JOIN skus s ON pb.sku_id = s.id
    JOIN products p ON s.product_id = p.id
    LEFT JOIN status st ON p.status_id = st.id
    LEFT JOIN lot_agg l ON s.id = l.sku_id
    LEFT JOIN status_priority sp ON s.id = sp.sku_id
    LEFT JOIN status_names sn ON sp.min_priority = sn.priority
    WHERE p.status_id = $1 AND s.status_id = $1
    GROUP BY
      s.id, s.sku, p.brand, s.country_code, s.size_label,
      p.name,
      l.total_lots, l.total_lot_quantity,
      l.total_available_quantity, l.total_reserved_quantity,
      l.earliest_manufacture_date, l.nearest_expiry_date,
      sp.min_priority, sn.name
    ORDER BY sp.min_priority ASC, product_name ASC, recorded_quantity ASC
  `;
  
  try {
    logSystemInfo('Fetching paginated SKU inventory summary', {
      context: 'warehouse-inventory-repository',
      params: { page, limit, statusId },
    });
    
    return await paginateResults({
      dataQuery: baseQuery,
      params: [statusId],
      page,
      limit,
    });
  } catch (error) {
    logSystemError('Error fetching paginated SKU inventory summary', {
      context: 'warehouse-inventory-repository',
      error,
    });
    
    throw AppError.databaseError('Failed to fetch paginated SKU inventory summary');
  }
};

/**
 * Fetches a paginated list of enriched warehouse inventory records,
 * including associated product details and summarized lot-level data.
 *
 * The result includes fields such as:
 * - Total lot quantity and reserved quantity (from `warehouse_inventory_lots`)
 * - Status summary (`in_stock`, `expired`, etc.)
 * - Earliest manufacture and expiry dates
 * - Product name or identifier
 * - Warehouse location and metadata
 *
 * @param {Object} params - Filter and pagination options.
 * @param {number} params.page - Page number for pagination.
 * @param {number} params.limit - Number of results per page.
 * @param {string} [params.sortBy] - Column to sort by (e.g., 'warehouse_name').
 * @param {string} [params.sortOrder='ASC'] - Sort direction ('ASC' or 'DESC').
 * @returns {Promise<Object>} Paginated result containing enriched warehouse inventory records.
 */
const getWarehouseInventories = async ({
  page,
  limit,
  sortBy,
  sortOrder = 'ASC',
}) => {
  const validSortColumns = {
    warehouse_name: 'w.name',
    location_name: 'l.name',
    storage_capacity: 'w.storage_capacity',
    created_at: 'wi.created_at',
    updated_at: 'wi.updated_at',
    item_name: 'item_name',
    in_stock_quantity: 'in_stock_quantity',
    total_reserved_quantity: 'total_reserved_quantity',
    total_lot_quantity: 'total_lot_quantity',
  };

  // Default sorting (by warehouse name & creation time)
  const defaultSortBy = 'w.name, w.created_at';
  sortBy = validSortColumns[sortBy] || defaultSortBy;

  // Validate sortOrder, default to 'ASC'
  sortOrder = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase())
    ? sortOrder.toUpperCase()
    : 'ASC';

  const tableName = 'warehouse_inventory wi';

  const joins = [
    'LEFT JOIN warehouses w ON wi.warehouse_id = w.id',
    'LEFT JOIN inventory i ON wi.inventory_id = i.id',
    'LEFT JOIN products p ON i.product_id = p.id',
    'LEFT JOIN locations l ON w.location_id = l.id',
    'LEFT JOIN warehouse_lot_status ws ON wi.status_id = ws.id',
    'LEFT JOIN users u1 ON wi.created_by = u1.id',
    'LEFT JOIN users u2 ON wi.updated_by = u2.id',
    'LEFT JOIN warehouse_inventory_lots wil ON wi.warehouse_id = wil.warehouse_id AND wi.inventory_id = wil.inventory_id',
    'LEFT JOIN warehouse_lot_status wls ON wil.status_id = wls.id',
  ];

  const whereClause = '1=1';

  const baseQuery = `
    SELECT
      wi.id AS warehouse_inventory_id,
      wi.warehouse_id,
      w.name AS warehouse_name,
      w.storage_capacity,
      l.name AS location_name,
      wi.inventory_id,
      i.item_type,
      COALESCE(NULLIF(p.product_name, ''), i.identifier) AS item_name,
      wi.reserved_quantity,
      wi.available_quantity,
      wi.warehouse_fee,
      wi.last_update,
      wi.created_at,
      wi.updated_at,
      COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
      COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by,
      (
        SELECT SUM(wil2.quantity)
        FROM warehouse_inventory_lots wil2
        JOIN warehouse_lot_status wls2 ON wil2.status_id = wls2.id
        WHERE wil2.inventory_id = wi.inventory_id
          AND wil2.warehouse_id = wi.warehouse_id
          AND wls2.name = 'in_stock'
      ) AS in_stock_quantity,
      SUM(wil.reserved_quantity) AS total_reserved_quantity,
      SUM(wil.quantity) AS total_lot_quantity,
      MIN(wil.manufacture_date) AS earliest_manufacture_date,
      MIN(wil.expiry_date) AS nearest_expiry_date,
      COALESCE(
        (
          SELECT wls2.name
          FROM warehouse_inventory_lots wil2
          JOIN warehouse_lot_status wls2 ON wil2.status_id = wls2.id
          WHERE wil2.inventory_id = wi.inventory_id
            AND wil2.warehouse_id = wi.warehouse_id
          ORDER BY
            CASE
              WHEN wls2.name = 'expired' THEN 1
              WHEN wls2.name = 'suspended' THEN 2
              WHEN wls2.name = 'unavailable' THEN 3
              WHEN wls2.name = 'out_of_stock' THEN 4
              WHEN wls2.name = 'in_stock' THEN 5
              ELSE 6
            END
          LIMIT 1
        ),
        'unassigned'
      ) AS display_status,
      (
        SELECT wil2.status_date
        FROM warehouse_inventory_lots wil2
        JOIN warehouse_lot_status wls2 ON wil2.status_id = wls2.id
        WHERE wil2.inventory_id = wi.inventory_id
          AND wil2.warehouse_id = wi.warehouse_id
        ORDER BY
          CASE
            WHEN wls2.name = 'expired' THEN 1
            WHEN wls2.name = 'suspended' THEN 2
            WHEN wls2.name = 'unavailable' THEN 3
            WHEN wls2.name = 'out_of_stock' THEN 4
            WHEN wls2.name = 'in_stock' THEN 5
            ELSE 6
          END
        LIMIT 1
      ) AS display_status_date
    FROM ${tableName}
    ${joins.join(' ')}
    WHERE ${whereClause}
    GROUP BY
      wi.id, w.id, l.id, i.id, p.product_name, i.identifier,
      ws.id, ws.name, u1.firstname, u1.lastname, u2.firstname, u2.lastname
  `;

  try {
    return await retry(async () => {
      return await paginateQuery({
        queryText: baseQuery,
        tableName,
        joins,
        whereClause,
        params: [],
        page,
        limit,
        sortBy,
        sortOrder,
      });
    });
  } catch (error) {
    logError('Error fetching all warehouse inventories:', error);
    throw AppError.databaseError('Failed to fetch all warehouse inventories.');
  }
};

/**
 * Retrieves a summarized view of items stored in a specific warehouse.
 *
 * Each item (including products and other inventory types) is grouped by inventory ID
 * and includes metrics such as total lots, reserved quantity, available quantity,
 * total quantity, lot-level reserved quantity, and expiry date ranges.
 *
 * @param {Object} params - Parameters for the summary query.
 * @param {string} params.warehouse_id - UUID of the warehouse.
 * @param {number} [params.page=1] - Page number for pagination.
 * @param {number} [params.limit=10] - Number of records per page.
 * @returns {Promise<Object>} - A paginated result of item inventory summaries.
 * @throws {AppError} - Throws a database error if query fails.
 */
const getWarehouseItemSummary = async ({
  warehouse_id,
  page = 1,
  limit = 10,
}) => {
  const tableName = 'warehouse_inventory wi';

  const joins = [
    'INNER JOIN warehouse_inventory_lots wil ON wi.warehouse_id = wil.warehouse_id AND wi.inventory_id = wil.inventory_id',
    'JOIN inventory i ON wi.inventory_id = i.id', // Fetch from inventory
    'LEFT JOIN products p ON i.product_id = p.id', // Referenced via inventory
  ];

  // Dynamic WHERE clause
  const whereClause = 'wi.warehouse_id = $1';
  const params = [warehouse_id];

  // Base Query
  const baseQuery = `
    SELECT
        i.id AS inventory_id,
        i.item_type,
        COALESCE(NULLIF(p.product_name, ''), i.identifier) AS item_name,
        COUNT(DISTINCT wil.lot_number) AS total_lots,
        SUM(wi.reserved_quantity) AS total_reserved_stock,
        SUM(wi.available_quantity) AS total_available_stock,
        SUM(wil.reserved_quantity) AS total_lot_reserved_stock,
        SUM(wil.quantity) AS total_quantity_stock,
        COUNT(DISTINCT CASE WHEN wil.quantity = 0 THEN wil.lot_number END) AS total_zero_stock_lots,
        MIN(CASE WHEN wil.quantity > 0 THEN wil.expiry_date ELSE NULL END) AS earliest_expiry,
        MAX(CASE WHEN wil.quantity > 0 THEN wil.expiry_date ELSE NULL END) AS latest_expiry
    FROM ${tableName}
    ${joins.join(' ')}
    WHERE ${whereClause}
    GROUP BY i.id, i.item_type, i.identifier, p.product_name
  `;

  try {
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: baseQuery,
        params,
        page,
        limit,
        sortBy: 'item_name',
        sortOrder: 'ASC',
      });
    });
  } catch (error) {
    logError(
      `Error fetching warehouse item summary (warehouse_id: ${warehouse_id}, page: ${page}, limit: ${limit}):`,
      error
    );
    throw AppError.databaseError('Failed to fetch warehouse item summary.');
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
 * Inserts records into the warehouse_inventory table using transactions.
 * Handles conflicts and ensures existing records are locked before updating.
 *
 * @param {Object} client - Transaction client.
 * @param {Array} inventoryData - List of inventory records to insert.
 * @returns {Promise<Array>} - List of inserted or updated warehouse inventory records.
 */
const insertWarehouseInventoryRecords = async (client, inventoryData) => {
  if (!Array.isArray(inventoryData) || inventoryData.length === 0) {
    throw AppError.validationError(
      'Invalid inventory data. Expected a non-empty array.'
    );
  }

  try {
    // Step 1: Lock Existing Rows Before Insert/Update (With Retry)
    await retry(
      () =>
        lockRows(
          client,
          'warehouse_inventory',
          inventoryData.map(({ warehouse_id, inventory_id }) => ({
            warehouse_id,
            inventory_id,
          })),
          'FOR UPDATE'
        ),
      3, // Retries up to 3 times
      1000 // Initial delay of 1s, with exponential backoff
    );

    // Step 2: Prepare Data for Bulk Insert
    const columns = [
      'warehouse_id',
      'inventory_id',
      'reserved_quantity',
      'available_quantity',
      'warehouse_fee',
      'status_id',
      'status_date',
      'created_at',
      'created_by',
      'updated_at',
      'updated_by',
      'last_update',
    ];

    const rows = inventoryData.map(
      ({
        warehouse_id,
        inventory_id,
        available_quantity,
        warehouse_fee,
        status_id,
        created_by,
      }) => [
        warehouse_id,
        inventory_id,
        0,
        available_quantity || 0,
        warehouse_fee || 0,
        status_id,
        new Date(),
        new Date(),
        created_by,
        null,
        null,
        null,
      ]
    );

    // Step 3: Bulk Insert with Retry and Conflict Handling
    return (
      (await retry(
        () =>
          bulkInsert(
            'warehouse_inventory',
            columns,
            rows,
            ['warehouse_id', 'inventory_id'], // Conflict Columns
            [] // Fields to do nothing on conflict
          ),
        3, // Retries up to 3 times
        1000 // Initial delay of 1s, with exponential backoff
      )) || []
    );
  } catch (error) {
    logError('Error inserting warehouse inventory records:', error);
    throw AppError.databaseError(
      'Failed to insert warehouse inventory records.',
      {
        details: { error: error.message, inventoryData },
      }
    );
  }
};

/**
 * Updates the available quantity of multiple inventory items across different warehouses in bulk using transactions.
 *
 * @param {Object} client - Database transaction object used to execute queries.
 * @param {Object} warehouseUpdates - An object mapping composite keys (`warehouse_id-inventory_id`) to the new quantity.
 *   - Example:
 *     ```js
 *     {
 *       "814cfc1d-e245-41be-b3f6-bcac548e1927-168bdc32-18a3-40f9-87c5-1ad77ad2258a": 6,
 *       "814cfc1d-e245-41be-b3f6-bcac548e1927-a430cacf-d7b5-4915-a01a-aa1715476300": 40
 *     }
 *     ```
 * @param {string} userId - The UUID of the user performing the update (stored in `updated_by`).
 * @returns {Promise<void>} - Resolves when the update operation completes successfully.
 *
 * @throws {Error} - Throws an error if the update query fails.
 *
 * @example
 * await updateWarehouseInventoryQuantity(client, {
 *   "814cfc1d-e245-41be-b3f6-bcac548e1927-168bdc32-18a3-40f9-87c5-1ad77ad2258a": 6,
 *   "814cfc1d-e245-41be-b3f6-bcac548e1927-a430cacf-d7b5-4915-a01a-aa1715476300": 40
 * }, "e9a62a2a-0350-4e36-95cc-86237a394fe0");
 */
const updateWarehouseInventoryQuantity = async (
  client,
  warehouseUpdates,
  userId
) => {
  const columnTypes = {
    reserved_quantity: 'integer',
    available_quantity: 'integer',
  };

  const { baseQuery, params } = await formatBulkUpdateQuery(
    'warehouse_inventory',
    ['reserved_quantity', 'available_quantity'],
    ['warehouse_id', 'inventory_id'],
    warehouseUpdates,
    userId,
    columnTypes
  );

  if (baseQuery) {
    return await retry(
      async () => {
        const { rows } = await query(baseQuery, params, client);
        return rows; // Return the updated inventory IDs
      },
      3, // Retry up to 3 times
      1000 // Initial delay of 1 second (exponential backoff applied)
    );
  }

  return [];
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

/**
 * Fetches the available and reserved quantities from warehouse_inventory
 * for a list of (warehouse_id, inventory_id) pairs.
 *
 * @param {Array<{ warehouseId: string, inventoryId: string }>} items - List of warehouse-inventory pairs.
 * @param {Object} [client] - Optional DB client (for transaction support).
 * @returns {Promise<Object>} - Object keyed by 'warehouseId-inventoryId' with quantity info:
 *   {
 *     'warehouseId-inventoryId': {
 *       available_quantity: number,
 *       reserved_quantity: number
 *     },
 *     ...
 *   }
 *
 * @throws {AppError} - Throws if DB query fails.
 */
const fetchWarehouseInventoryQuantities = async (items, client = null) => {
  if (!Array.isArray(items) || items.length === 0) return {};

  try {
    const conditions = items
      .map((_, index) => `($${index * 2 + 1}::uuid, $${index * 2 + 2}::uuid)`)
      .join(', ');

    const params = items.flatMap(({ warehouseId, inventoryId }) => [
      warehouseId,
      inventoryId,
    ]);

    const queryText = `
      SELECT warehouse_id, inventory_id, available_quantity, reserved_quantity
      FROM warehouse_inventory
      WHERE (warehouse_id, inventory_id) IN (${conditions})
    `;

    const { rows } = await query(queryText, params, client);

    const result = {};
    for (const row of rows) {
      const key = `${row.warehouse_id}-${row.inventory_id}`;
      result[key] = {
        available_quantity: Number(row.available_quantity ?? 0),
        reserved_quantity: Number(row.reserved_quantity ?? 0),
      };
    }

    return result;
  } catch (error) {
    throw AppError.databaseError(
      'Failed to fetch warehouse inventory quantities',
      error
    );
  }
};

module.exports = {
  getPaginatedSkuInventorySummary,
  getWarehouseInventories,
  getWarehouseItemSummary,
  getWarehouseInventoryDetailsByWarehouseId,
  checkWarehouseInventoryBulk,
  insertWarehouseInventoryRecords,
  updateWarehouseInventoryQuantity,
  getRecentInsertWarehouseInventoryRecords,
  fetchWarehouseInventoryQuantities,
};

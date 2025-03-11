const {
  query,
  paginateQuery,
  retry,
  withTransaction,
  bulkInsert,
  lockRow,
  lockRows,
  formatBulkUpdateQuery,
} = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');
const { checkInventoryExists } = require('./inventory-repository');

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
    status_id: 'w.status_id',
    created_at: 'w.created_at',
    updated_at: 'w.updated_at',
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
  ];

  const whereClause = '1=1'; // No filters by default

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
      wi.status_id,
      ws.name AS status_name,
      wi.status_date,
      wi.created_at,
      wi.updated_at,
      COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
      COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by
    FROM ${tableName}
    ${joins.join(' ')}
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

const getWarehouseProductSummary = async ({
  warehouse_id,
  page = 1,
  limit = 10,
}) => {
  const tableName = 'warehouse_inventory wi';

  const joins = [
    'INNER JOIN warehouse_inventory_lots wil ON wi.warehouse_id = wil.warehouse_id AND wi.inventory_id = wil.inventory_id',
    'JOIN inventory i ON wi.inventory_id = i.id', // Fetch from inventory
    'JOIN products p ON i.product_id = p.id', // Referenced via inventory
  ];

  // Dynamic WHERE clause
  const whereClause = 'wi.warehouse_id = $1';
  const params = [warehouse_id];

  // Base Query
  const baseQuery = `
    SELECT
        i.id AS inventory_id,
        p.product_name,
        COUNT(DISTINCT wil.lot_number) AS total_lots,
        SUM(wi.reserved_quantity) AS total_reserved_stock,
        SUM(wi.available_quantity) AS total_available_stock,
        SUM(wil.quantity) AS total_quantity_stock,
        COUNT(DISTINCT CASE WHEN wil.quantity = 0 THEN wil.lot_number END) AS total_zero_stock_lots,
        MIN(CASE WHEN wil.quantity > 0 THEN wil.expiry_date ELSE NULL END) AS earliest_expiry,
        MAX(CASE WHEN wil.quantity > 0 THEN wil.expiry_date ELSE NULL END) AS latest_expiry
    FROM ${tableName}
    ${joins.join(' ')}
    WHERE ${whereClause}
    GROUP BY i.id, p.product_name
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
        sortBy: 'p.product_name',
        sortOrder: 'ASC',
      });
    });
  } catch (error) {
    logError(
      `Error fetching warehouse product summary (warehouse_id: ${warehouse_id}, page: ${page}, limit: ${limit}):`,
      error
    );
    throw AppError.databaseError('Failed to fetch warehouse product summary.');
  }
};

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
        COALESCE(wi.available_quantity, 0) AS available_stock,
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
    throw AppError.databaseError('Failed to fetch warehouse inventory details.');
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
    throw AppError.validationError('Invalid inventory data. Expected a non-empty array.');
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
  const { baseQuery, params } = await formatBulkUpdateQuery(
    'warehouse_inventory',
    ['available_quantity'],
    ['warehouse_id', 'inventory_id'],
    warehouseUpdates,
    userId
  );

  if (baseQuery) {
    return await retry(
      async () => {
        const { rows } = client
          ? await query(baseQuery, params)
          : await client.query(baseQuery, params);
        return rows; // Return the updated inventory IDs
      },
      3, // Retry up to 3 times
      1000 // Initial delay of 1 second (exponential backoff applied)
    );
  }

  return []; // Return empty array if no updates were made
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
            i.quantity,
            wil.lot_number,
            wil.expiry_date,
            wil.manufacture_date,
            i.created_at AS inventory_created_at,
            COALESCE(u1.firstname, '') || ' ' || COALESCE(u1.lastname, 'Unknown') AS inventory_created_by,
            i.updated_at AS inventory_updated_at,
            COALESCE(u2.firstname, '') || ' ' || COALESCE(u2.lastname, 'Unknown') AS inventory_updated_by,
            wi.available_quantity,
            p.product_name,
            i.identifier,
            i.product_id
        FROM warehouse_inventory_lots wil
        JOIN inventory i ON wil.inventory_id = i.id
        JOIN warehouse_inventory wi ON wil.inventory_id = wi.inventory_id
                                     AND wil.warehouse_id = wi.warehouse_id
        LEFT JOIN users u1 ON i.created_by = u1.id
        LEFT JOIN users u2 ON i.updated_by = u2.id
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
                    'quantity', ld.quantity,
                    'inserted_quantity', i.quantity,
                    'available_quantity', ld.available_quantity,
                    'lot_number', ld.lot_number,
                    'expiry_date', ld.expiry_date,
                    'manufacture_date', ld.manufacture_date,
                    'inbound_date', i.inbound_date,
                    'inventory_created_at', ld.inventory_created_at,
                    'inventory_created_by', ld.inventory_created_by,
                    'inventory_updated_at', ld.inventory_updated_at,
                    'inventory_updated_by', ld.inventory_updated_by
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
  getWarehouseInventories,
  getWarehouseProductSummary,
  getWarehouseInventoryDetailsByWarehouseId,
  checkWarehouseInventoryBulk,
  insertWarehouseInventoryRecords,
  updateWarehouseInventoryQuantity,
  getRecentInsertWarehouseInventoryRecords,
};

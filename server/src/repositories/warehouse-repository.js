const { query, paginateQuery, retry, lockRow } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError, logWarn } = require('../utils/logger-helper');

const getWarehouses = async ({ page, limit, sortBy, sortOrder }) => {
  const validSortColumns = [
    'name', // Sort by warehouse name
    'location_name', // Sort by location name
    'storage_capacity', // Sort by storage capacity
    'status_id', // Sort by warehouse status
    'created_at', // Sort by record creation time
    'updated_at', // Sort by record last updated time
  ];

  // Default sorting (by name & creation time if invalid sortBy is provided)
  const defaultSortBy = 'w.name, w.created_at';
  sortBy = validSortColumns.includes(sortBy) ? `w.${sortBy}` : defaultSortBy;

  const tableName = 'warehouses w';

  const joins = [
    'LEFT JOIN locations l ON w.location_id = l.id',
    'LEFT JOIN status s ON w.status_id = s.id',
    'LEFT JOIN users u1 ON w.created_by = u1.id',
    'LEFT JOIN users u2 ON w.updated_by = u2.id',
  ];

  const whereClause = '1=1'; // No filters by default

  const baseQuery = `
    SELECT
        w.id,
        w.name AS warehouse_name,
        l.name AS location_name,
        w.storage_capacity,
        s.name AS status_name,
        w.created_at,
        w.updated_at,
        COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
        COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by
    FROM ${tableName}
    ${joins.join(' ')}
  `;

  try {
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: baseQuery,
        params: [],
        page,
        limit,
        sortBy,
        sortOrder,
      });
    });
  } catch (error) {
    logError('Error fetching warehouses:', error);
    throw AppError.databaseError('Failed to fetch warehouses.');
  }
};

const getWarehouseDetailsById = async (warehouseId) => {
  const queryText = `
    SELECT
        w.id AS warehouse_id,
        w.name AS warehouse_name,
        w.storage_capacity,
        w.status_id AS warehouse_status_id,
        s.name AS warehouse_status_name,
        w.created_at AS warehouse_created_at,
        w.updated_at AS warehouse_updated_at,
        COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
        COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by,
    
        -- Location Details
        l.id AS location_id,
        l.name AS location_name,
        l.address AS location_address,
        lt.id AS location_type_id,
        lt.name AS location_type_name,
        lt.description AS location_type_description,
    
        -- Location Status Details
        l.status_id AS location_status_id,
        sl.name AS location_status_name,
        l.status_date AS location_status_date
    
    FROM warehouses w
    -- Join location and its type
    JOIN locations l ON w.location_id = l.id
    JOIN location_types lt ON l.location_type_id = lt.id
    
    -- Join status tables for warehouse and location
    JOIN status s ON w.status_id = s.id
    JOIN status sl ON l.status_id = sl.id
    
    -- Join creator & updater details for warehouse
    LEFT JOIN users u1 ON w.created_by = u1.id
    LEFT JOIN users u2 ON w.updated_by = u2.id
    
    WHERE w.id = $1;
  `;

  try {
    const { rows } = await retry(
      () => query(queryText, [warehouseId]),
      3,
      1000
    );
    if (rows.length === 0) {
      throw AppError.notFoundError(
        `Warehouse with ID ${warehouseId} not found`
      );
    }
    return rows[0];
  } catch (error) {
    logError('Error fetching warehouse details repository:', error);
    throw error;
  }
};

const getWarehouseInventorySummary = async ({ page, limit, statusFilter }) => {
  const tableName = 'warehouses w';

  // Joins using an array (easier to modify in the future)
  const joins = ['LEFT JOIN status s ON w.status_id = s.id'];

  // Dynamic status filtering
  let whereClause = '1=1'; // Default where clause
  const params = [];

  if (statusFilter && statusFilter !== 'all') {
    whereClause += ` AND s.name = $1`;
    params.push(statusFilter);
  }

  // Base Query
  const baseQuery = `
    WITH warehouse_lot_totals AS (
      SELECT
        warehouse_id,
        inventory_id,
        SUM(quantity) AS total_lot_quantity
      FROM warehouse_inventory_lots
      GROUP BY warehouse_id, inventory_id
    )
    SELECT
      w.id AS warehouse_id,
      w.name AS warehouse_name,
      COALESCE(s.name, 'unknown') AS status_name,
      COUNT(DISTINCT wi.inventory_id) AS total_products,
      COALESCE(SUM(DISTINCT wlt.total_lot_quantity), 0) AS total_quantity,
      COALESCE(SUM(wi.reserved_quantity), 0) AS total_reserved_stock,
      SUM(
        CASE
          WHEN wlt.total_lot_quantity - wi.reserved_quantity > 0
          THEN wlt.total_lot_quantity - wi.reserved_quantity
          ELSE 0
        END
      ) AS total_available_stock,
      COALESCE(SUM(wi.warehouse_fee), 0) AS total_warehouse_fees,
      MAX(wi.last_update) AS last_inventory_update,
      COUNT(DISTINCT wil.lot_number) AS total_lots,
      MIN(wil.expiry_date) FILTER (WHERE wil.expiry_date IS NOT NULL) AS earliest_expiry,
      MAX(wil.expiry_date) FILTER (WHERE wil.expiry_date IS NOT NULL) AS latest_expiry,
      COUNT(DISTINCT CASE WHEN wil.quantity = 0 THEN wil.lot_number END) AS total_zero_stock_lots
  
    FROM ${tableName}
    LEFT JOIN warehouse_inventory wi ON w.id = wi.warehouse_id
    LEFT JOIN warehouse_lot_totals wlt
           ON wi.warehouse_id = wlt.warehouse_id
           AND wi.inventory_id = wlt.inventory_id
    LEFT JOIN warehouse_inventory_lots wil
           ON wi.inventory_id = wil.inventory_id
           AND w.id = wil.warehouse_id
    LEFT JOIN inventory i ON wi.inventory_id = i.id
    LEFT JOIN status s ON w.status_id = s.id

    WHERE s.name = $1
    
    GROUP BY w.id, w.name, s.name
 `;

  try {
    // Use pagination if required
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: baseQuery,
        params,
        page,
        limit,
        sortBy: 'w.name',
        sortOrder: 'ASC',
      });
    });
  } catch (error) {
    logError(
      `Error fetching warehouse inventory summary (page: ${page}, limit: ${limit}, status: ${statusFilter}):`,
      error
    );
    throw AppError.databaseError(
      'Failed to fetch warehouse inventory summary.'
    );
  }
};

/**
 * Fetches location IDs based on warehouse IDs.
 * @param {object} client - Transaction client.
 * @param {Array<string>} warehouseIds - List of warehouse UUIDs.
 * @returns {Promise<object>} - Mapping of warehouse_id → location_id.
 */
const geLocationIdByWarehouseId = async (client, warehouseIds) => {
  if (!Array.isArray(warehouseIds) || warehouseIds.length === 0) {
    throw AppError.validationError(
      'Invalid warehouse IDs input. Expected a non-empty array.'
    );
  }

  const queryText = `
    SELECT id AS warehouse_id, location_id
    FROM warehouses
    WHERE id = ANY($1::uuid[]);
  `;

  return await retry(
    async () => {
      try {
        const { rows } = client
          ? await query(queryText, [warehouseIds])
          : await client.query(queryText, [warehouseIds]);
        return Object.fromEntries(
          rows.map(({ warehouse_id, location_id }) => [
            warehouse_id,
            location_id,
          ])
        );
      } catch (error) {
        logError('Error fetching location IDs for warehouses:', error);
        throw error;
      }
    },
    3,
    1000
  ); // Retry up to 3 times with exponential backoff
};

/**
 * Checks if a warehouse exists and locks the row to prevent concurrent modifications.
 *
 * @param {object} client - Database client (transaction connection).
 * @param {string|null} warehouseId - The warehouse ID to check (optional).
 * @param {string|null} locationId - The location ID to check (optional).
 * @returns {Promise<Object|null>} - Returns the locked warehouse row or null if not found.
 */
const checkAndLockWarehouse = async (client, warehouseId, locationId) => {
  if (!warehouseId && !locationId) {
    throw AppError.validationError(
      'Either warehouseId or locationId must be provided.'
    );
  }

  let warehouseToLock = warehouseId;

  // Step 1: Fetch warehouse ID if only location ID is provided
  if (!warehouseId && locationId) {
    const warehouse = await geLocationIdByWarehouseId(client, locationId);
    if (!warehouse) {
      logWarn(`No warehouse found for location_id: ${locationId}`);
      return null;
    }
    warehouseToLock = warehouse;
  }

  // Step 2: Lock the warehouse row using lockRow function
  return await lockRow(client, 'warehouses', warehouseToLock, 'FOR UPDATE');
};

const getActiveWarehousesForDropdown = async () => {
  const queryText = `
    SELECT w.id, w.name
    FROM warehouses w
    INNER JOIN status s ON w.status_id = s.id
    WHERE s.name = 'active'
    ORDER BY w.name ASC
  `;

  try {
    const { rows } = await query(queryText);
    return rows;
  } catch (error) {
    logError('Error fetching warehouses for dropdown', {
      message: error.message,
      stack: error.stack,
    });
    throw AppError.databaseError('Failed to fetch warehouse dropdown list', {
      originalError: error.message,
    });
  }
};

module.exports = {
  getWarehouses,
  getWarehouseDetailsById,
  getWarehouseInventorySummary,
  checkAndLockWarehouse,
  geLocationIdByWarehouseId,
  getActiveWarehousesForDropdown,
};

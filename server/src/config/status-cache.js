const { query } = require('../database/db');
const {
  logSystemException,
  logSystemError,
} = require('../utils/system-logger');
const AppError = require('../utils/AppError');

let statusMap = null;

/**
 * Defines mappings from logical status keys used in application code
 * to their corresponding status name and source table in the database.
 *
 * - `key`: The name used in the app to refer to this status (e.g., 'product_active')
 * - `table`: The source table where the status resides (e.g., 'status', 'inventory_status')
 * - `name`: The exact status name in the DB (case-insensitive match)
 *
 * This is used by `getStatusIdMap()` to dynamically fetch status UUIDs for system-wide usage.
 */
const STATUS_KEY_LOOKUP = [
  { key: 'product_active', table: 'status', name: 'active' },
  { key: 'pricing_type_active', table: 'status', name: 'active' },
  { key: 'warehouse_active', table: 'status', name: 'active' },
  { key: 'sku_active', table: 'status', name: 'active' },
  { key: 'inventory_in_stock', table: 'inventory_status', name: 'in_stock' },
  {
    key: 'inventory_out_of_stock',
    table: 'inventory_status',
    name: 'out_of_stock',
  },
  {
    key: 'inventory_unassigned',
    table: 'inventory_status',
    name: 'unassigned',
  },
  {
    key: 'action_manual_stock_insert',
    table: 'inventory_action_types',
    name: 'manual_stock_insert',
  },
  {
    key: 'adjustment_manual_stock_insert',
    table: 'lot_adjustment_types',
    name: 'manual_stock_insert',
  },
];

/**
 * Fetches a map of application-level status keys to actual status UUIDs,
 * by dynamically resolving entries defined in the `status_keys` table.
 *
 * Example output:
 * {
 *   product_active: 'uuid-...',
 *   warehouse_active: 'uuid-...',
 *   lot_in_stock: 'uuid-...'
 * }
 *
 * This allows central configuration of logical status keys and prevents hardcoding.
 *
 * @returns {Promise<Readonly<Record<string, string>>>} A frozen map of { a key: UUID }
 * @throws {AppError} When the status map query fails
 */
const getStatusIdMap = async () => {
  try {
    const nameSet = new Set();
    const unions = [];

    for (const { table, name } of STATUS_KEY_LOOKUP) {
      nameSet.add(`${table}:${name}`);
    }

    const uniquePairs = Array.from(nameSet);

    for (const entry of uniquePairs) {
      const [table, name] = entry.split(':');
      unions.push(`
        SELECT '${table}' AS source, LOWER(name) AS name, id FROM ${table} WHERE LOWER(name) = '${name.toLowerCase()}'
      `);
    }

    const sql = unions.join(' UNION ALL ');

    const { rows } = await query(sql);

    const map = {};
    for (const { key, table, name } of STATUS_KEY_LOOKUP) {
      const row = rows.find(
        (r) => r.source === table && r.name === name.toLowerCase()
      );
      if (row) map[key] = row.id;
    }

    return Object.freeze(map);
  } catch (error) {
    logSystemException(error, 'Failed to fetch status IDs', {
      context: 'get-status-id-map',
    });

    throw AppError.databaseError('Failed to initialize status map', {
      details: error.message,
    });
  }
};

/**
 * Initializes and caches status ID a map for later use.
 * Throws if data cannot be fetched — designed to fail fast on boot.
 */
const initStatusCache = async () => {
  try {
    statusMap = await getStatusIdMap();
  } catch (error) {
    logSystemException(error, 'Failed to load status ID map', {
      context: 'init-status-cache',
    });
    throw error;
  }
};

/**
 * Retrieves a cached status ID by key, e.g., "product_active", "lot_in_stock".
 * @param {string} key
 * @returns {string} UUID of the status
 * @throws Error if status cache is not initialized or key is missing
 */
const getStatusId = (key) => {
  if (!statusMap) {
    throw AppError.initializationError(
      `Status map not initialized. Cannot fetch key: "${key}"`
    );
  }

  if (!statusMap[key]) {
    logSystemError('Status key not found in cache', {
      context: 'get-status-id',
      missingKey: key,
    });
    throw AppError.notFoundError(`Missing status ID for key: "${key}"`);
  }

  return statusMap[key];
};

module.exports = {
  initStatusCache,
  getStatusId,
};

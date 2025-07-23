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
  {
    key: 'inventory_in_stock',
    table: 'inventory_status',
    name: 'in_stock',
  },
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
  {
    key: 'customer_active',
    table: 'status',
    name: 'active',
  },
  {
    key: 'order_type_active',
    table: 'status',
    name: 'active',
  },
  {
    key: 'discount_active',
    table: 'status',
    name: 'active',
  },
  {
    key: 'delivery_method_active',
    table: 'status',
    name: 'active',
  },
];

/**
 * Fetches a map of application-level status keys to actual status UUIDs,
 * by dynamically resolving entries defined in the `STATUS_KEY_LOOKUP` array
 * through safe parameterized SQL queries.
 *
 * This map enables system-wide usage of logical status keys
 * without hardcoding UUIDs in application logic.
 *
 * Example output:
 * {
 *   product_active: 'uuid-...',
 *   warehouse_active: 'uuid-...',
 *   inventory_in_stock: 'uuid-...'
 * }
 *
 * @returns {Promise<Readonly<Record<string, string>>>}
 *   A frozen map where each key is a logical status key and each value is the corresponding UUID.
 *
 * @throws {AppError}
 *   Throws if the status map query fails or if initialization fails.
 */
const getStatusIdMap = async () => {
  try {
    const nameSet = new Set();
    const unions = [];
    const params = [];
    let paramIndex = 1;

    for (const { table, name } of STATUS_KEY_LOOKUP) {
      nameSet.add(`${table}:${name}`);
    }

    const uniquePairs = Array.from(nameSet);

    for (const entry of uniquePairs) {
      const [table, name] = entry.split(':');
      unions.push(`
        SELECT '${table}' AS source, LOWER(name) AS name, id
        FROM ${table}
        WHERE LOWER(name) = $${paramIndex}
      `);
      params.push(name.toLowerCase());
      paramIndex++;
    }

    const sql = unions.join(' UNION ALL ');

    const { rows } = await query(sql, params);

    const map = {};
    for (const { key, table, name } of STATUS_KEY_LOOKUP) {
      const row = rows.find(
        (r) => r.source === table && r.name === name.toLowerCase()
      );
      if (row) {
        map[key] = row.id;
      }
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
 * @param {keyof typeof STATUS_KEY_LOOKUP | string} key
 * @returns {string} UUID of the status
 * @throws Error if status cache is not initialized or key is missing
 */
const getStatusId = (key) => {
  if (!statusMap || typeof statusMap !== 'object') {
    throw AppError.initializationError(
      `Status map not properly initialized. Cannot fetch key: "${key}"`
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

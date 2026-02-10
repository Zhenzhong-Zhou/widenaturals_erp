/**
 * @fileoverview
 * Centralized status cache manager for system-wide status lookups.
 *
 * - Supports both global (pool-based) and transactional (client-based) initialization.
 * - Provides in-memory caching for both logical status keys → UUIDs,
 *   and UUID → name/row mappings.
 * - Automatically refreshes status data at runtime.
 */

const { query, pool } = require('../database/db');
const {
  logSystemException,
  logSystemError,
  logSystemInfo,
} = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { getAllStatuses } = require('../repositories/status-repository');

let statusMap = null;
// ---------------------------------------------
// Private in-memory maps (atomic swap pattern)
// ---------------------------------------------
let STATUS_NAME_MAP = new Map(); // id (UUID) → UPPERCASE(name)
let STATUS_ROW_MAP = new Map(); // id (UUID) → full row object

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
  {
    key: 'general_active',
    table: 'status',
    name: 'active',
  },
  {
    key: 'general_inactive',
    table: 'status',
    name: 'inactive',
  },
  { key: 'pricing_type_active', table: 'status', name: 'active' },
  { key: 'pricing_active', table: 'status', name: 'active' },
  { key: 'warehouse_active', table: 'status', name: 'active' },
  { key: 'sku_active', table: 'status', name: 'active' },
  {
    key: 'batch_active',
    table: 'batch_status',
    name: 'active',
  },
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
  {
    key: 'packaging_material_active',
    table: 'status',
    name: 'active',
  },
  {
    key: 'inventory_allocation_init',
    table: 'inventory_allocation_status',
    name: 'pending',
  },
  {
    key: 'outbound_shipment_init',
    table: 'shipment_status',
    name: 'pending',
  },
  {
    key: 'order_fulfillment_init',
    table: 'fulfillment_status',
    name: 'pending',
  },
  {
    key: 'login_success',
    table: 'auth_action_types',
    name: 'Login Success',
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
const getStatusIdMap = async (client = null) => {
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

    // Use provided client if inside a transaction; fallback to shared pool otherwise
    const { rows } = await query(sql, params, client || pool);

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
 * Initializes and caches the logical status ID map for later use.
 *
 * ### Behavior
 * - Uses `getStatusIdMap(client)` to populate a key → UUID map.
 * - Designed to fail fast if initialization fails (halts boot).
 * - Can optionally run inside a transactional boot context.
 *
 * @param {import('pg').PoolClient} [client] - Optional PostgreSQL client for boot-time initialization.
 * @returns {Promise<void>}
 * @throws {AppError.initializationError} If loading the status ID map fails.
 */
const initStatusCache = async (client = null) => {
  try {
    // Pass the client down to share connection context
    statusMap = await getStatusIdMap(client || pool);

    logSystemInfo('Initialized logical status ID map', {
      context: 'status-cache/initStatusCache',
      count: Object.keys(statusMap).length,
    });
  } catch (error) {
    logSystemException(error, 'Failed to load status ID map', {
      context: 'status-cache/initStatusCache',
    });
    throw AppError.initializationError('Failed to initialize status ID map', {
      details: error.message,
    });
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

/**
 * Repository: Load All Statuses into Cache
 *
 * Loads all rows from the `status` table into two in-memory maps:
 * - `STATUS_NAME_MAP`: For lightweight UUID → UPPERCASE(name) lookups
 * - `STATUS_ROW_MAP`:  For full record access (name, description, timestamps, etc.)
 *
 * ### Notes
 * - Independent of `STATUS_KEY_LOOKUP` cache used by getStatusIdMap().
 * - Uses atomic swap to avoid race conditions when replacing cached data.
 *
 * @param {import('pg').PoolClient} [client] - Optional PostgreSQL client for transaction context.
 * @returns {Promise<void>}
 * @throws {AppError} If the query or initialization fails.
 */
const loadAllStatusesIntoCache = async (client) => {
  try {
    // Use provided client if in a transaction, else fallback to shared pool
    const rows = await getAllStatuses(client);

    // Prepare next generation of maps for atomic replacement
    const nextNameMap = new Map();
    const nextRowMap = new Map();

    for (const row of rows) {
      const code = (row.name || '').toUpperCase();
      nextNameMap.set(row.id, code);
      nextRowMap.set(row.id, row);
    }

    // Atomic swap to prevent race conditions
    STATUS_NAME_MAP = nextNameMap;
    STATUS_ROW_MAP = nextRowMap;

    logSystemInfo('Status name and row caches loaded successfully', {
      context: 'status-cache/loadAllStatusesIntoCache',
      recordCount: rows.length,
    });
  } catch (error) {
    logSystemException(error, 'Failed to load status cache', {
      context: 'status-cache/loadAllStatusesIntoCache',
    });

    throw AppError.databaseError('Failed to load status cache.', {
      context: 'status-cache/loadAllStatusesIntoCache',
      details: error.message,
    });
  }
};

/**
 * Retrieves the uppercase status name/code (e.g., "ACTIVE") by UUID.
 * Returns null if the ID is unknown.
 *
 * @param {string} statusId - Status UUID
 * @returns {string|null} Uppercased status name, or null if not found
 */
const getStatusNameById = (statusId) => {
  if (!statusId) return null;
  return STATUS_NAME_MAP.get(statusId) ?? null;
};

/**
 * Retrieves the full status record (id, name, description, etc.) by UUID.
 * Returns null if the ID is unknown.
 *
 * @param {string} statusId - Status UUID
 * @returns {{
 *   id: string,
 *   name: string,
 *   description: string|null,
 *   is_active: boolean,
 *   created_at: string,
 *   updated_at: string
 * }|null}
 */
const getStatusRowById = (statusId) => STATUS_ROW_MAP.get(statusId) ?? null;

/**
 * Initializes the full status caches on application boot.
 * Safe to call alongside `initStatusCache()` (logical key→ID cache).
 *
 * @param {import('pg').PoolClient} [client] - Optional PG client (for boot-time transaction)
 * @returns {Promise<void>}
 */
const initStatusNameCache = async (client) => {
  await loadAllStatusesIntoCache(client);
};

/**
 * Initializes all status caches at application startup.
 *
 * Combines:
 * - Logical key → UUID map (`initStatusCache`)
 * - UUID → name/row maps (`initStatusNameCache`)
 *
 * ### Features
 * - Loads both caches atomically for consistency.
 * - Provides optional background auto-refresh (default every 10 minutes).
 * - Safe to call during app bootstrap or runtime reloads.
 *
 * @param {import('pg').PoolClient} [client] - Optional PostgreSQL client for boot-time transaction.
 * @param {boolean} [enableAutoRefresh=true] - Enable background periodic refresh.
 * @param {number} [refreshIntervalMs=600000] - Refresh interval (default 10 minutes).
 * @throws {AppError.initializationError} If any cache initialization fails.
 *
 * @returns {Promise<void>}
 */
const initAllStatusCaches = async (
  client,
  enableAutoRefresh = true,
  refreshIntervalMs = 10 * 60 * 1000
) => {
  const startTime = Date.now();
  logSystemInfo('Initializing all status caches...', {
    context: 'status-cache/initAllStatusCaches',
  });

  try {
    // Step 1: Run both caches concurrently (boot-time)
    await Promise.all([
      initStatusCache(client), // key → UUID
      initStatusNameCache(client), // UUID → name/row
    ]);

    const elapsed = Date.now() - startTime;
    logSystemInfo('All status caches initialized successfully', {
      context: 'status-cache/initAllStatusCaches',
      elapsedMs: elapsed,
    });

    // Step 2: Periodic auto-refresh (pool-based, not transaction client)
    if (enableAutoRefresh) {
      let refreshing = false;

      setInterval(async () => {
        if (refreshing) return; // skip overlapping refresh
        refreshing = true;

        try {
          await loadAllStatusesIntoCache(); // uses pool by default
          logSystemInfo('Status cache refresh completed', {
            context: 'status-cache/auto-refresh',
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          logSystemException(err, 'Status cache refresh failed', {
            context: 'status-cache/auto-refresh',
          });
        } finally {
          refreshing = false;
        }
      }, refreshIntervalMs);

      logSystemInfo('Periodic status cache auto-refresh enabled', {
        context: 'status-cache/initAllStatusCaches',
        refreshIntervalMs,
      });
    }
  } catch (error) {
    logSystemException(error, 'Failed to initialize all status caches', {
      context: 'status-cache/initAllStatusCaches',
    });
    throw AppError.initializationError('Failed to initialize status caches.', {
      details: error.message,
    });
  }
};

module.exports = {
  initAllStatusCaches, // top-level init (main entry)
  getStatusId, // main public lookup
  getStatusNameById,
  getStatusRowById,
  loadAllStatusesIntoCache,
  initStatusCache,
  initStatusNameCache,
};

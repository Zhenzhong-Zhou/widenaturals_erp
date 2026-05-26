/**
 * @file status-cache.js
 * @description Centralized status cache manager for system-wide status lookups.
 *
 * Responsibilities:
 * - Cache logical application status keys to database UUIDs
 *   (e.g. 'shipment_completed' → '<uuid>') via STATUS_KEY_LOOKUP
 * - Cache master `status` UUIDs to uppercase names and full rows
 *   for generic active/inactive/archived lookups
 * - Cache per-domain status codes (order, shipment, fulfillment,
 *   inventory-allocation, inventory-transfer, payment,
 *   transfer-order-item) with bidirectional UUID ↔ code maps
 *   for domain operations
 * - Support both pool-based and transactional initialization
 * - Refresh non-key caches in the background on a fixed interval
 *
 * Context:
 * - Used during bootstrap and runtime lookups
 * - Exposes synchronous getters after async initialization
 *
 * Design:
 * - Use atomic map replacement for refreshes so callers never see
 *   partial state
 * - Fail fast during bootstrap initialization
 * - Pass through AppErrors from the repo layer unchanged; wrap only
 *   unexpected errors at orchestration boundaries
 * - Log exceptions once at orchestration boundaries (bootstrap, the
 *   background refresh timer) — no HTTP request context to propagate
 *   through globalErrorHandler from those entry points
 */

const { query, pool } = require('../database/db');
const {
  logSystemException,
  logSystemInfo,
} = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const { getAllStatuses, getAllDomainStatusCodes } = require('../repositories/status-repository');

/**
 * @typedef {Object} StatusRow
 * @property {string} id
 * @property {string} name
 * @property {string|null} description
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} DomainStatusEntry
 * @property {string} id     - Per-domain status row UUID
 * @property {string} code   - Canonical short code (e.g. 'PENDING', 'COMPLETED')
 * @property {string} name   - Human-readable name
 * @property {string} table  - Source table the row came from
 */

/** @type {Readonly<Record<string, string>> | null} */
let statusMap = null;

let STATUS_NAME_MAP = new Map();

/** @type {Map<string, StatusRow>} */
let STATUS_ROW_MAP = new Map();

/** @type {Map<string, DomainStatusEntry>} */
let STATUS_CODE_BY_ID_MAP = new Map();

/** @type {Map<string, DomainStatusEntry>} */
let STATUS_ID_BY_CODE_MAP = new Map();

/** @type {ReturnType<typeof setInterval> | null} */
let statusCacheRefreshTimer = null;

const CONTEXT = 'status-cache';

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
  {
    key: 'general_archived',
    table: 'status',
    name: 'archived',
  },
  { key: 'pricing_type_active', table: 'status', name: 'active' },
  { key: 'pricing_active', table: 'status', name: 'active' },
  { key: 'warehouse_active', table: 'status', name: 'active' },
  { key: 'sku_active', table: 'status', name: 'active' },
  {
    key: 'batch_released',
    table: 'batch_status',
    name: 'released',
  },
  {
    key: 'batch_pending',
    table: 'batch_status',
    name: 'pending',
  },
  {
    key: 'batch_received',
    table: 'batch_status',
    name: 'received',
  },
  {
    key: 'batch_quarantined',
    table: 'batch_status',
    name: 'quarantined',
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
    key: 'action_manual_stock_adjust',
    table: 'inventory_action_types',
    name: 'manual_adjustment',
  },
  {
    key: 'action_fulfilled',
    table: 'inventory_action_types',
    name: 'fulfilled',
  },
  {
    key: 'adjustment_manual_adjustment',
    table: 'lot_adjustment_types',
    name: 'adjustment',
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
    key: 'fulfillment_completed',
    table: 'fulfillment_status',
    name: 'completed',
  },
  {
    key: 'order_delivered',
    table: 'order_status',
    name: 'Delivered',
  },
  {
    key: 'shipment_completed',
    table: 'shipment_status',
    name: 'completed',
  },
  {
    key: 'login_success',
    table: 'auth_action_types',
    name: 'Login Success',
  },
  {
    key: 'login_failure_invalid_credentials',
    table: 'auth_action_types',
    name: 'Invalid Credentials',
  },
  {
    key: 'login_failure_account_locked',
    table: 'auth_action_types',
    name: 'Account Locked',
  },
  {
    key: 'logout',
    table: 'auth_action_types',
    name: 'Logout',
  },
  {
    key: 'batch_created',
    table: 'batch_activity_types',
    name: 'Batch Created',
  },
];

/**
 * Builds the logical status key → UUID cache from the database.
 *
 * @param {import('pg').Pool | import('pg').PoolClient} [db=pool]
 * @returns {Promise<Readonly<Record<string, string>>>}
 * @throws {AppError} If the status map cannot be initialized.
 */
const getStatusIdMap = async (db = pool) => {
  try {
    const uniquePairs = [
      ...new Set(
        STATUS_KEY_LOOKUP.map(
          ({ table, name }) => `${table}:${name.toLowerCase()}`
        )
      ),
    ];

    const params = [];
    const unions = uniquePairs.map((entry, i) => {
      const [table, name] = entry.split(':');
      params.push(name);

      return `
        SELECT '${table}' AS source, LOWER(name) AS name, id
        FROM ${table}
        WHERE LOWER(name) = $${i + 1}
      `;
    });

    const sql = unions.join(' UNION ALL ');
    const { rows } = await query(sql, params, db);

    const rowIndex = new Map(
      rows.map((row) => [`${row.source}:${row.name}`, row.id])
    );

    const map = {};
    for (const { key, table, name } of STATUS_KEY_LOOKUP) {
      const id = rowIndex.get(`${table}:${name.toLowerCase()}`);
      if (id) map[key] = id;
    }

    return Object.freeze(map);
  } catch (error) {
    throw AppError.databaseError('Failed to initialize status map', {
      details: error.message,
      context: `${CONTEXT}/getStatusIdMap`,
    });
  }
};

/**
 * Initializes and caches the logical status key → UUID map.
 *
 * Behavior:
 * - Resolves logical application status keys through STATUS_KEY_LOOKUP
 * - Supports pool-based or transactional initialization
 * - Fails fast if initialization cannot complete
 *
 * @param {import('pg').Pool | import('pg').PoolClient} [db=pool]
 * @returns {Promise<void>}
 * @throws {AppError} If the logical status cache cannot be initialized.
 */
const initStatusCache = async (db = pool) => {
  statusMap = await getStatusIdMap(db);

  logSystemInfo('Initialized logical status ID map', {
    context: `${CONTEXT}/initStatusCache`,
    count: Object.keys(statusMap).length,
  });
};

/**
 * Retrieves a cached status UUID by logical key.
 *
 * @param {string} key - Logical application status key.
 * @returns {string}
 * @throws {AppError} If the cache is uninitialized or the key is missing.
 */
const getStatusId = (key) => {
  if (!statusMap || typeof statusMap !== 'object') {
    throw AppError.initializationError(
      `Status cache not initialized. Cannot resolve key: "${key}"`
    );
  }

  if (!statusMap[key]) {
    throw AppError.notFoundError(`Missing status ID for key: "${key}"`, {
      context: `${CONTEXT}/getStatusId`,
      key,
    });
  }

  return statusMap[key];
};

/**
 * Loads all status rows into the UUID → name and UUID → row caches.
 *
 * Notes:
 * - Independent of the logical key → UUID cache used by getStatusId()
 * - Uses atomic map replacement to avoid exposing partial refresh state
 *
 * @param {import('pg').PoolClient} [client]
 * @returns {Promise<void>}
 * @throws {AppError} If the cache cannot be loaded.
 */
const loadAllStatusesIntoCache = async (client) => {
  const context = `${CONTEXT}/loadAllStatusesIntoCache`;
  
  try {
    const rows = await getAllStatuses(client);
    
    const nextNameMap = new Map();
    const nextRowMap = new Map();
    
    for (const row of rows) {
      const code = (row.name || '').toUpperCase();
      nextNameMap.set(row.id, code);
      nextRowMap.set(row.id, row);
    }
    
    // Build replacement maps first, then swap references once complete.
    STATUS_NAME_MAP = nextNameMap;
    STATUS_ROW_MAP = nextRowMap;
    
    logSystemInfo('Status name and row caches loaded successfully', {
      context,
      recordCount: rows.length,
    });
  } catch (error) {
    // Pass through normalized errors from the repo layer unchanged.
    if (error instanceof AppError) throw error;
    
    throw AppError.databaseError('Unexpected error loading status cache', {
      context,
      details: error.message,
    });
  }
};

/**
 * Loads all per-domain status rows into the UUID → code reverse lookup cache.
 *
 * Notes:
 * - Covers order, shipment, fulfillment, allocation, transfer, payment, and
 *   transfer-item status tables. Each row is keyed by its UUID; the value
 *   carries `code`, `name`, and the source `table`.
 * - Independent of the master `status` caches loaded by
 *   loadAllStatusesIntoCache(); the two have zero ID overlap.
 * - Uses atomic map replacement to avoid exposing partial refresh state.
 *
 * @param {import('pg').PoolClient} [client]
 * @returns {Promise<void>}
 * @throws {AppError} If the cache cannot be loaded.
 */
const loadDomainStatusCodesIntoCache = async (client) => {
  const context = `${CONTEXT}/loadDomainStatusCodesIntoCache`;
  
  try {
    const rows = await getAllDomainStatusCodes(client);
    
    const nextByIdMap = new Map();
    const nextByCodeMap = new Map();
    
    for (const row of rows) {
      const entry = {
        id: row.id,
        code: row.code,
        name: row.name,
        table: row.source_table,
      };
      nextByIdMap.set(row.id, entry);
      nextByCodeMap.set(row.code, entry);
    }
    
    // Atomic swap — both maps replaced together so callers never see partial state.
    STATUS_CODE_BY_ID_MAP = nextByIdMap;
    STATUS_ID_BY_CODE_MAP = nextByCodeMap;
    
    logSystemInfo('Domain status code cache loaded successfully', {
      context,
      recordCount: rows.length,
    });
  } catch (error) {
    // Pass through normalized errors from the repo layer unchanged.
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unexpected error loading domain status code cache', {
      context,
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
 * Retrieves the full status record by UUID.
 *
 * @param {string} statusId
 * @returns {StatusRow | null}
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
 * Starts periodic background refresh for the master status caches
 * (UUID → name, UUID → row) and the per-domain status code cache.
 *
 * Behavior:
 * - Creates only one interval per process
 * - Skips overlapping refresh executions
 * - Refreshes the non-key caches sequentially so a failure in one
 *   does not corrupt the others
 *
 * @param {number} [refreshIntervalMs=600000] - Refresh interval in milliseconds.
 * @returns {void}
 */
const startStatusCacheAutoRefresh = (refreshIntervalMs = 10 * 60 * 1000) => {
  const context = `${CONTEXT}/startStatusCacheAutoRefresh`;

  // Prevent duplicate intervals if bootstrap is called more than once.
  if (statusCacheRefreshTimer) return;

  let refreshing = false;

  statusCacheRefreshTimer = setInterval(async () => {
    // Avoid overlapping refresh runs if one execution is still in progress.
    if (refreshing) return;
    refreshing = true;

    try {
      await loadAllStatusesIntoCache();
      await loadDomainStatusCodesIntoCache();
      
      logSystemInfo('Status cache refresh completed', {
        context,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logSystemException(error, 'Status cache refresh failed', {
        context,
      });
    } finally {
      refreshing = false;
    }
  }, refreshIntervalMs);

  // Do not keep the Node.js process alive solely for this background timer.
  statusCacheRefreshTimer.unref?.();

  logSystemInfo('Periodic status cache auto-refresh enabled', {
    context,
    refreshIntervalMs,
  });
};

/**
 * Initializes all status caches during application startup.
 *
 * Combines:
 * - logical key → UUID cache (STATUS_KEY_LOOKUP-driven)
 * - master UUID → uppercase name cache
 * - master UUID → full row cache
 * - per-domain UUID → code reverse-lookup cache
 *
 * Behavior:
 * - All four layers load in parallel
 * - Reports success only after every layer is ready
 * - Optionally enables background refresh for the master and
 *   domain-code caches (the logical key cache is never refreshed
 *   in the background — it's expected to be stable between deploys)
 *
 * @param {PoolClient} [client]
 * @param {boolean} [enableAutoRefresh=true]
 * @param {number} [refreshIntervalMs=600000]
 * @returns {Promise<void>}
 * @throws {AppError} If bootstrap cache initialization fails.
 */
const initAllStatusCaches = async (
  client,
  enableAutoRefresh = true,
  refreshIntervalMs = 10 * 60 * 1000
) => {
  const context = `${CONTEXT}/initAllStatusCaches`;

  const startTime = Date.now();

  logSystemInfo('Initializing all status caches...', {
    context,
  });

  try {
    await Promise.all([
      initStatusCache(client),
      initStatusNameCache(client),
      loadDomainStatusCodesIntoCache(client),
    ]);

    if (enableAutoRefresh) {
      startStatusCacheAutoRefresh(refreshIntervalMs);
    }

    logSystemInfo('All status caches initialized successfully', {
      context,
      elapsedMs: Date.now() - startTime,
    });
  } catch (error) {
    logSystemException(error, 'Failed to initialize all status caches', {
      context,
    });

    throw AppError.initializationError('Failed to initialize status caches', {
      details: error.message,
      context,
    });
  }
};

/**
 * Retrieves a per-domain status code (e.g., "PENDING", "COMPLETED")
 * for a domain status UUID. Covers shipment, fulfillment, allocation,
 * transfer, payment, and transfer-item status tables.
 *
 * Returns null if the ID is unknown or belongs to a table not covered
 * by this cache (e.g. a master `status` ID — use getStatusNameById
 * for those).
 *
 * @param {string} statusId - Per-domain status UUID
 * @returns {string|null} Status code, or null if not found
 */
const getStatusCodeById = (statusId) => {
  if (!statusId) return null;
  return STATUS_CODE_BY_ID_MAP.get(statusId)?.code ?? null;
};

/**
 * Retrieves a per-domain status UUID by its canonical code
 * (e.g. 'SHIPMENT_IN_TRANSIT', 'FULFILLMENT_SHIPPED', 'ORDER_SHIPPED').
 * Returns null if the code is unknown or belongs to a table not
 * covered by this cache.
 *
 * @param {string} code
 * @returns {string|null}
 */
const getStatusIdByCode = (code) => {
  if (!code) return null;
  return STATUS_ID_BY_CODE_MAP.get(code)?.id ?? null;
};

module.exports = {
  initAllStatusCaches,        // top-level init (main entry)
  getStatusId,                // main public lookup
  getStatusNameById,
  getStatusCodeById,
  getStatusIdByCode,
  getStatusRowById,
  loadAllStatusesIntoCache,
  loadDomainStatusCodesIntoCache,
  initStatusCache,
  initStatusNameCache,
};

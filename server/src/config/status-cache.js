const { query } = require('../database/db');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

let statusMap = null;

/**
 * Fetches status IDs from multiple status-related tables.
 * Returns a map like: { product_active: <uuid>, lot_in_stock: <uuid> }
 *
 * @returns {Promise<Object>} Status ID map
 */
const getStatusIdMap = async () => {
  try {
    const sql = `
      SELECT 'status' AS source, LOWER(name) AS name, id FROM status WHERE LOWER(name) IN ('active')
      UNION ALL
      SELECT 'warehouse_lot_status', LOWER(name), id FROM warehouse_lot_status WHERE LOWER(name) IN ('in_stock')
    `;
    
    const { rows } = await query(sql);
    
    const map = {};
    for (const row of rows) {
      if (row.source === 'status' && row.name === 'active') {
        map.product_active = row.id;
        map.warehouse_active = row.id;
      } else if (row.source === 'warehouse_lot_status' && row.name === 'in_stock') {
        map.lot_in_stock = row.id;
      }
    }
    
    return Object.freeze(map); // prevent accidental mutation
  } catch (err) {
    logError('[getStatusIdMap] Failed to fetch status IDs:', err);
    throw AppError.hashError('Failed to initialize status map');
  }
};

/**
 * Initializes and caches status ID a map for later use.
 * Throws if data cannot be fetched — designed to fail fast on boot.
 */
const initStatusCache = async () => {
  try {
    statusMap = await getStatusIdMap();
  } catch (err) {
    logError('[initStatusCache] Failed to load status ID map:', err);
    throw err;
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
    throw AppError.hashError(`Status map not initialized. Cannot fetch key: "${key}"`);
  }
  if (!statusMap[key]) {
    logError(`[getStatusId] Status key not found: "${key}"`);
    throw AppError.notFoundError(`Missing status ID for key: "${key}"`);
  }
  return statusMap[key];
};

module.exports = {
  initStatusCache,
  getStatusId,
};

const AppError = require('../utils/AppError');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const { getBatchActivityTypes } = require('../repositories/batch-activity-type-repository');

// -------------------------------------------------------------
// In-memory cache container
// -------------------------------------------------------------
const CACHE = {
  map: null,      // code → activity_type_id
  loadedAt: null, // timestamp when cache was last loaded
};

/**
 * Initialize or reload the batch activity type cache.
 *
 * This function queries active activity types from the database and
 * constructs an in-memory lookup map keyed by activity type `code`.
 *
 * The cache is intended to be initialized during server startup and reused
 * throughout the application's lifetime to avoid repeated database queries.
 *
 * Benefits:
 * - O(1) runtime lookup for activity type IDs
 * - Reduced database load
 * - Deterministic activity type resolution
 *
 * The resulting lookup map is frozen using `Object.freeze()` to prevent
 * accidental mutation at runtime.
 *
 * @async
 * @function initBatchActivityTypeCache
 *
 * @param {Object|null} [client=null]
 * Optional PostgreSQL transaction client.
 *
 * @returns {Promise<void>}
 *
 * @throws {AppError}
 * - Throws validation error if no activity types exist
 * - Throws validation error if duplicate codes are detected
 * - Propagates database errors from the repository
 */
const initBatchActivityTypeCache = async (client = null) => {
  const context = 'batch-activity-type-cache/initBatchActivityTypeCache';
  
  try {
    const rows = await getBatchActivityTypes(client);
    
    // Ensure activity types exist
    if (!Array.isArray(rows) || rows.length === 0) {
      throw AppError.validationError(
        'Batch activity type cache initialization failed. No records found.'
      );
    }
    
    const map = {};
    
    // Build code → id lookup map
    for (const row of rows) {
      if (map[row.code]) {
        throw AppError.validationError(
          `Duplicate batch activity type code detected: ${row.code}`
        );
      }
      
      map[row.code] = row.id;
    }
    
    // Freeze to prevent runtime mutation
    CACHE.map = Object.freeze(map);
    CACHE.loadedAt = new Date();
    
    logSystemInfo('Batch activity type cache initialized', {
      context,
      totalTypes: rows.length,
      loadedAt: CACHE.loadedAt.toISOString(),
    });
    
  } catch (error) {
    logSystemException(
      error,
      'Failed to initialize batch activity type cache',
      { context }
    );
    
    throw error;
  }
};

/**
 * Refresh the batch activity type cache.
 *
 * This helper allows the cache to be reloaded without restarting the server.
 * It simply re-runs the initialization process.
 *
 * Useful when activity types are modified during runtime operations.
 *
 * @async
 * @function refreshBatchActivityTypeCache
 *
 * @returns {Promise<void>}
 */
const refreshBatchActivityTypeCache = async () => {
  return initBatchActivityTypeCache();
};

/**
 * Resolve a batch activity type ID from its code.
 *
 * Performs an O(1) lookup against the in-memory cache.
 *
 * @function
 *
 * @param {string} code
 * Activity type code (e.g. `BATCH_CREATED`, `BATCH_RELEASED`).
 *
 * @returns {string}
 * Returns the activity type ID corresponding to the provided code.
 *
 * @throws {AppError}
 * - Throws initialization error if cache has not been loaded
 * - Throws validation error if the provided code is invalid
 * - Throws not found error if the activity type code does not exist
 */
const getBatchActivityTypeId = (code) => {
  if (!CACHE.map) {
    throw AppError.initializationError(
      'Batch activity type cache not initialized.'
    );
  }
  
  if (!code || typeof code !== 'string') {
    throw AppError.validationError('Invalid batch activity type code.');
  }
  
  const id = CACHE.map[code];
  
  if (!id) {
    throw AppError.notFoundError(
      `Missing batch activity type for code: "${code}"`
    );
  }
  
  return id;
};

/**
 * Retrieve cache diagnostics.
 *
 * This helper exposes metadata about the current cache state for debugging
 * or health-check endpoints.
 *
 * @function getBatchActivityTypeCacheInfo
 *
 * @returns {{loadedAt: Date|null, totalTypes: number}}
 * Returns cache metadata including load timestamp and total types.
 */
const getBatchActivityTypeCacheInfo = () => {
  return {
    loadedAt: CACHE.loadedAt,
    totalTypes: CACHE.map ? Object.keys(CACHE.map).length : 0,
  };
};

module.exports = {
  initBatchActivityTypeCache,
  refreshBatchActivityTypeCache,
  getBatchActivityTypeId,
  getBatchActivityTypeCacheInfo,
};

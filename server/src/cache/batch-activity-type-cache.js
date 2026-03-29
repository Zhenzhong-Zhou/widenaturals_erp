/**
 * @file batch-activity-type-cache.js
 * @description
 * In-memory cache for batch activity type code-to-ID resolution.
 *
 * Initialized at server startup via initBatchActivityTypeCache(). Provides
 * O(1) lookups to avoid repeated DB queries for static reference data.
 * The cache map is frozen after load to prevent accidental runtime mutation.
 */

'use strict';

const AppError = require('../utils/AppError');
const { logSystemInfo, logSystemException } = require('../utils/logging/system-logger');
const { getBatchActivityTypes } = require('../repositories/batch-activity-type-repository');

const CACHE = {
  map:      null, // code → activity_type_id, frozen after load
  loadedAt: null, // timestamp of last successful load
};

/**
 * Initializes or reloads the batch activity type cache from the database.
 *
 * Queries all active activity types, validates uniqueness, and builds a
 * frozen code-to-id lookup map. Intended to run at server startup and
 * optionally on demand when activity types change.
 *
 * @param {Object|null} [client=null] - Optional PostgreSQL transaction client
 * @returns {Promise<void>}
 * @throws {AppError} ValidationError if no records exist or duplicate codes are detected
 * @throws {AppError} Propagates DB errors from the repository
 */
const initBatchActivityTypeCache = async (client = null) => {
  const context = 'batch-activity-type-cache/initBatchActivityTypeCache';
  
  let rows;
  
  try {
    rows = await getBatchActivityTypes(client);
  } catch (error) {
    logSystemException(error, 'Failed to initialize batch activity type cache', {
      context,
    });
    throw error;
  }
  
  // Validation errors are expected — throw directly without logging
  if (!Array.isArray(rows) || rows.length === 0) {
    throw AppError.validationError(
      'Batch activity type cache initialization failed: no records found.'
    );
  }
  
  const map = {};
  
  for (const row of rows) {
    if (map[row.code]) {
      throw AppError.validationError(
        `Duplicate batch activity type code detected: ${row.code}`
      );
    }
    map[row.code] = row.id;
  }
  
  // Freeze to prevent accidental mutation after load
  CACHE.map = Object.freeze(map);
  CACHE.loadedAt = new Date();
  
  logSystemInfo('Batch activity type cache initialized', {
    context,
    totalTypes: rows.length,
    loadedAt: CACHE.loadedAt.toISOString(),
  });
};

/**
 * Resolves a batch activity type ID from its code string.
 *
 * Performs an O(1) lookup against the in-memory cache.
 * Cache must be initialized before this is called.
 *
 * @param {string} code - Activity type code (e.g. 'BATCH_CREATED', 'BATCH_RELEASED')
 * @returns {string} Corresponding activity type ID
 * @throws {AppError} InitializationError if cache has not been loaded
 * @throws {AppError} ValidationError if code is absent or not a string
 * @throws {AppError} NotFoundError if the code has no matching entry in the cache
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
 * Returns cache diagnostics for health checks and debugging.
 *
 * @returns {{ loadedAt: Date|null, totalTypes: number }}
 */
const getBatchActivityTypeCacheInfo = () => ({
  loadedAt:   CACHE.loadedAt,
  totalTypes: CACHE.map ? Object.keys(CACHE.map).length : 0,
});

module.exports = {
  initBatchActivityTypeCache,
  getBatchActivityTypeId,
  getBatchActivityTypeCacheInfo,
};

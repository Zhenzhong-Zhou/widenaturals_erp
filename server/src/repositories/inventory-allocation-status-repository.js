/**
 * @file inventory-allocation-status-repository.js
 * @description Database access layer for inventory allocation status records.
 *
 * Follows the established repo pattern:
 *  - Query constants imported from inventory-allocation-status-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getInventoryAllocationStatusId        — fetch single status ID by code via getUniqueScalarValue
 *  - getInventoryAllocationStatusesByCodes — bulk fetch status records by code array
 */

'use strict';

const { getUniqueScalarValue } = require('../utils/db/record-utils');
const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  INVENTORY_ALLOCATION_STATUS_GET_BY_CODES,
} = require('./queries/inventory-allocation-status-queries');

// ─── Single Value ─────────────────────────────────────────────────────────────

/**
 * Fetches a single inventory allocation status ID by its code.
 *
 * Delegates entirely to `getUniqueScalarValue` which handles logging,
 * not-found errors, and duplicate-result errors internally.
 * No additional error handling is needed here.
 *
 * @param {string}     statusCode - The allocation status code to look up.
 * @param {PoolClient} client     - DB client for transactional context.
 *
 * @returns {Promise<string>} The status UUID matching the given code.
 * @throws  {AppError}        If no record is found or the query fails.
 */
const getInventoryAllocationStatusId = async (statusCode, client) => {
  return await getUniqueScalarValue(
    {
      table:  'inventory_allocation_status',
      where:  { code: statusCode },
      select: 'id',
    },
    client,
    {
      context: 'inventory-allocation-status-repository/getInventoryAllocationStatusId',
      statusCode,
    }
  );
};

// ─── Bulk Fetch ───────────────────────────────────────────────────────────────

/**
 * Fetches inventory allocation status records by their codes.
 *
 * Returns an empty array if statusCodes is empty — no query is executed.
 *
 * @param {string[]}   statusCodes - Array of allocation status codes to fetch.
 * @param {PoolClient} client      - DB client for transactional context.
 *
 * @returns {Promise<Array<{ id: string, code: string }>>} Matching status records.
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getInventoryAllocationStatusesByCodes = async (statusCodes, client) => {
  if (!Array.isArray(statusCodes) || statusCodes.length === 0) return [];
  
  const context = 'inventory-allocation-status-repository/getInventoryAllocationStatusesByCodes';
  
  try {
    const result = await query(INVENTORY_ALLOCATION_STATUS_GET_BY_CODES, [statusCodes], client);
    return result.rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch inventory allocation statuses by codes.',
      meta:    { statusCodes },
      logFn:   (err) => logDbQueryError(
        INVENTORY_ALLOCATION_STATUS_GET_BY_CODES,
        [statusCodes],
        err,
        { context, statusCodes }
      ),
    });
  }
};

module.exports = {
  getInventoryAllocationStatusId,
  getInventoryAllocationStatusesByCodes,
};

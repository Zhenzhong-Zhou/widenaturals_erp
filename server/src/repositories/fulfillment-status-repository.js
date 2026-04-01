/**
 * @file fulfillment-status-repository.js
 * @description Database access layer for fulfillment status records.
 *
 * Follows the established repo pattern:
 *  - Query constants imported from fulfillment-status-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getFulfillmentStatusByCode   — fetch single status by code with field mapping
 *  - getFulfillmentStatusesByIds  — bulk fetch status records by id array
 */

'use strict';

const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  FULFILLMENT_STATUS_GET_BY_CODE,
  FULFILLMENT_STATUS_GET_BY_IDS,
} = require('./queries/fulfillment-status-queries');

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches a fulfillment status record by its code.
 *
 * Maps snake_case DB columns to camelCase before returning — this is the
 * only repo function that performs field mapping, matching the shape expected
 * by the fulfillment service layer.
 *
 * @param {string}          statusCode    - The fulfillment status code to look up.
 * @param {PoolClient|null} [client=null] - Optional DB client for transactional context.
 *
 * @returns {Promise<{ id: string, code: string, sortOrder: number, category: string, isDefault: boolean }>}
 * @throws  {AppError} Not found error if no status exists for the given code.
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getFulfillmentStatusByCode = async (statusCode, client = null) => {
  const context = 'fulfillment-status-repository/getFulfillmentStatusByCode';
  
  try {
    const { rows } = await query(FULFILLMENT_STATUS_GET_BY_CODE, [statusCode], client);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch fulfillment status by code.',
      meta:    { statusCode },
      logFn:   (err) => logDbQueryError(
        FULFILLMENT_STATUS_GET_BY_CODE,
        [statusCode],
        err,
        { context, statusCode }
      ),
    });
  }
};

// ─── Bulk Fetch ───────────────────────────────────────────────────────────────

/**
 * Fetches fulfillment status records by their IDs.
 *
 * Returns an empty array if statusIds is empty — no query is executed.
 *
 * @param {string[]}        statusIds     - UUID array of status IDs to fetch.
 * @param {PoolClient|null} [client=null] - Optional DB client for transactional context.
 *
 * @returns {Promise<Array<{ id: string, code: string, name: string }>>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getFulfillmentStatusesByIds = async (statusIds, client = null) => {
  if (!Array.isArray(statusIds) || statusIds.length === 0) return [];
  
  const context = 'fulfillment-status-repository/getFulfillmentStatusesByIds';
  
  try {
    const result = await query(FULFILLMENT_STATUS_GET_BY_IDS, [statusIds], client);
    return result.rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch fulfillment statuses by IDs.',
      meta:    { statusIds },
      logFn:   (err) => logDbQueryError(
        FULFILLMENT_STATUS_GET_BY_IDS,
        [statusIds],
        err,
        { context, statusIds }
      ),
    });
  }
};

module.exports = {
  getFulfillmentStatusByCode,
  getFulfillmentStatusesByIds,
};

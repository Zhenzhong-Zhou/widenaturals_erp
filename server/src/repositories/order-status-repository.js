/**
 * @file order-status-repository.js
 * @description Database access layer for order status records.
 *
 * Follows the established repo pattern:
 *  - Query constants imported from order-status-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getOrderStatusIdByCode        — fetch single status ID by code
 *  - getOrderStatusByCode          — fetch single status record by code
 *  - getOrderStatusMetadataById    — fetch status name/category/code by id
 *  - getOrderStatusesByCodes       — bulk fetch status records by code array
 */

'use strict';

const { getUniqueScalarValue, getFieldsById, query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  ORDER_STATUS_GET_BY_CODE,
  ORDER_STATUS_GET_BY_CODES,
} = require('./queries/order-status-queries');

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches a single order status ID by its code.
 *
 * Delegates entirely to `getUniqueScalarValue` which handles logging,
 * not-found errors, and duplicate-result errors internally.
 *
 * @param {string}          code          - The order status code to look up.
 * @param {PoolClient|null} [client=null] - Optional DB client for transactional context.
 *
 * @returns {Promise<string>} The status UUID matching the given code.
 * @throws  {AppError}        If no record is found or the query fails.
 */
const getOrderStatusIdByCode = async (code, client = null) => {
  return await getUniqueScalarValue(
    {
      table:  'order_status',
      where:  { code },
      select: 'id',
    },
    client,
    {
      context: 'order-status-repository/getOrderStatusIdByCode',
      code,
    }
  );
};

/**
 * Fetches a single order status record by its code.
 *
 * Returns null if no record exists — not-found handling belongs in the
 * service layer, consistent with the repo pattern.
 *
 * @param {string}          statusCode    - The order status code to look up.
 * @param {PoolClient|null} [client=null] - Optional DB client for transactional context.
 *
 * @returns {Promise<{ id: string, code: string, category: string }|null>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getOrderStatusByCode = async (statusCode, client = null) => {
  const context = 'order-status-repository/getOrderStatusByCode';
  
  try {
    const { rows } = await query(ORDER_STATUS_GET_BY_CODE, [statusCode], client);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch order status by code.',
      meta:    { statusCode },
      logFn:   (err) => logDbQueryError(
        ORDER_STATUS_GET_BY_CODE, [statusCode], err, { context, statusCode }
      ),
    });
  }
};

/**
 * Fetches order status name, category, and code by ID.
 *
 * Delegates to `getFieldsById` which handles execution and error
 * normalization internally.
 *
 * @param {string}     id     - UUID of the order status.
 * @param {PoolClient} client - DB client for transactional context.
 *
 * @returns {Promise<{ name: string, category: string, code: string }|null>}
 * @throws  {AppError} If the query fails.
 */
const getOrderStatusMetadataById = async (id, client) => {
  return await getFieldsById(
    'order_status',
    id,
    ['name', 'category', 'code'],
    client
  );
};

// ─── Bulk Fetch ───────────────────────────────────────────────────────────────

/**
 * Fetches order status records by their codes.
 *
 * Returns an empty array if statusCodes is empty — no query is executed.
 *
 * @param {string[]}   statusCodes - Array of order status codes to fetch.
 * @param {PoolClient} client      - DB client for transactional context.
 *
 * @returns {Promise<Array<{ id: string, code: string, category: string }>>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getOrderStatusesByCodes = async (statusCodes, client) => {
  if (!Array.isArray(statusCodes) || statusCodes.length === 0) return [];
  
  const context = 'order-status-repository/getOrderStatusesByCodes';
  
  try {
    const result = await query(ORDER_STATUS_GET_BY_CODES, [statusCodes], client);
    return result.rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch order statuses by codes.',
      meta:    { statusCodes },
      logFn:   (err) => logDbQueryError(
        ORDER_STATUS_GET_BY_CODES, [statusCodes], err, { context, statusCodes }
      ),
    });
  }
};

module.exports = {
  getOrderStatusIdByCode,
  getOrderStatusByCode,
  getOrderStatusMetadataById,
  getOrderStatusesByCodes,
};

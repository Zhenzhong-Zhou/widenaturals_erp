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
 *  - getFulfillmentStatusesByIds  — bulk fetch status records by id array
 */

'use strict';

const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  FULFILLMENT_STATUS_GET_BY_IDS,
} = require('./queries/fulfillment-status-queries');

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
    const result = await query(
      FULFILLMENT_STATUS_GET_BY_IDS,
      [statusIds],
      client
    );
    return result.rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch fulfillment statuses by IDs.',
      meta: { statusIds },
      logFn: (err) =>
        logDbQueryError(FULFILLMENT_STATUS_GET_BY_IDS, [statusIds], err, {
          context,
          statusIds,
        }),
    });
  }
};

module.exports = {
  getFulfillmentStatusesByIds,
};

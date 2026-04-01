/**
 * @file transfer-order-item-status-repository.js
 * @description Database access layer for transfer order item status records.
 *
 * Exports:
 *  - getTransferItemStatusesByCodes — fetch status rows matching a code array
 */

'use strict';

const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  GET_TRANSFER_ITEM_STATUSES_BY_CODES_QUERY,
} = require('./queries/transfer-order-item-status-queries');

// ─── Fetch by Codes ───────────────────────────────────────────────────────────

/**
 * Fetches transfer order item status rows matching the given code array.
 *
 * Returns an empty array immediately when statusCodes is empty.
 *
 * @param {string[]}                statusCodes - Status code values to look up.
 * @param {import('pg').PoolClient} client      - Transaction client.
 *
 * @returns {Promise<Array<{id: string, code: string}>>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getTransferItemStatusesByCodes = async (statusCodes, client) => {
  if (!Array.isArray(statusCodes) || statusCodes.length === 0) return [];
  
  const context = 'transfer-order-item-status-repository/getTransferItemStatusesByCodes';
  const params  = [statusCodes];
  
  try {
    const { rows } = await query(GET_TRANSFER_ITEM_STATUSES_BY_CODES_QUERY, params, client);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to retrieve transfer item statuses.',
      meta:    { statusCodes },
      logFn:   (err) => logDbQueryError(
        GET_TRANSFER_ITEM_STATUSES_BY_CODES_QUERY,
        params,
        err,
        { context, statusCodes }
      ),
    });
  }
};

module.exports = {
  getTransferItemStatusesByCodes,
};

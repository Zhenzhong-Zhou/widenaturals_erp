/**
 * @file shipment-status-repository.js
 * @description Database access layer for shipment status records.
 *
 * Exports:
 *  - getShipmentStatusByCode — fetch single shipment status record by code
 */

'use strict';

const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { SHIPMENT_STATUS_GET_BY_CODE } = require('./queries/shipment-status-queries');

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches a shipment status record by its code.
 *
 * Returns null if no record exists — not-found handling belongs in the
 * service layer, consistent with the repo pattern.
 *
 * @param {string}                      statusCode    - The shipment status code to look up.
 * @param {PoolClient|null} [client=null]
 *
 * @returns {Promise<{ id: string, code: string, is_final: boolean }|null>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getShipmentStatusByCode = async (statusCode, client = null) => {
  const context = 'shipment-status-repository/getShipmentStatusByCode';
  
  try {
    const { rows } = await query(SHIPMENT_STATUS_GET_BY_CODE, [statusCode], client);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch shipment status by code.',
      meta:    { statusCode },
      logFn:   (err) => logDbQueryError(
        SHIPMENT_STATUS_GET_BY_CODE, [statusCode], err, { context, statusCode }
      ),
    });
  }
};

module.exports = {
  getShipmentStatusByCode,
};

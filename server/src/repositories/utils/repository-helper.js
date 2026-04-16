/**
 * @file repository-helper.js
 * @description Shared query utilities for repository functions.
 *
 * Exports:
 *  - existsQuery — executes a SELECT 1 existence check and returns a boolean
 */

'use strict';

const { query } = require('../../database/db');
const { handleDbError } = require('../../utils/errors/error-handlers');
const { logDbQueryError } = require('../../utils/db-logger');

/**
 * Executes a SELECT 1 existence check query and returns a boolean.
 *
 * Designed for LIMIT 1 / EXISTS queries — returns true if at least
 * one row is returned, false otherwise.
 *
 * @param {string}          queryText  - The SQL query to execute.
 * @param {Array}           params     - Bound parameter values.
 * @param {string}          context    - Caller context string for error logging.
 * @param {string}          message    - Error message if the query fails.
 * @param {PoolClient|null} [client=null] - Optional DB client for transactional context.
 *
 * @returns {Promise<boolean>} True if at least one row exists, false otherwise.
 * @throws  {AppError}         Normalized database error if the query fails.
 */
const existsQuery = async (
  queryText,
  params,
  context,
  message,
  client = null
) => {
  try {
    const { rowCount } = await query(queryText, params, client);
    return rowCount > 0;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message,
      logFn: (err) => logDbQueryError(queryText, params, err, { context }),
    });
  }
};

module.exports = {
  existsQuery,
};

/**
 * @file user-warehouse-assignment-repository.js
 * @description
 * Repository for user-to-warehouse assignment lookups.
 *
 * Used by the warehouse inventory ACL layer to resolve which warehouses
 * a user is permitted to access.
 *
 * Exports:
 *  - getWarehouseIdsByUserId
 */

'use strict';

const { USER_WAREHOUSE_ASSIGNMENT_QUERY } = require('./queries/user-warehouse-assignment-queries');
const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');

const CONTEXT = 'user-warehouse-assignment-repository';

/**
 * Returns all warehouse UUIDs assigned to the given user.
 *
 * @param {string} userId
 * @returns {Promise<string[]>}
 * @throws {AppError} Normalized database error if the query fails.
 */
const getWarehouseIdsByUserId = async (userId) => {
  const context = `${CONTEXT}/getWarehouseIdsByUserId`;
  
  const params = [userId];
  
  try {
    const { rows } = await query(USER_WAREHOUSE_ASSIGNMENT_QUERY, params);
    return rows.map((r) => r.warehouse_id);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch warehouse assignments for user.',
      meta:    { userId },
      logFn:   (err) => logDbQueryError(USER_WAREHOUSE_ASSIGNMENT_QUERY, params, err, { context, userId }),
    });
  }
};

module.exports = {
  getWarehouseIdsByUserId,
};

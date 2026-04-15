/**
 * @file warehouse-movement-repository.js
 * @description
 * Repository for warehouse movement lookups.
 *
 * Follows the established repo pattern:
 *  - Query constants imported from warehouse-movement-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getWarehouseMovementsByInventoryId — fetch recent movements for a warehouse inventory record
 */

'use strict';

const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { WAREHOUSE_MOVEMENTS_BY_INVENTORY_ID_QUERY } = require('./queries/warehouse-movement-queries');

const CONTEXT = 'warehouse-movement-repository';

/**
 * Fetches the 20 most recent movement records for a given warehouse inventory entry,
 * ordered by performed_at descending.
 *
 * @param {string} inventoryId
 * @returns {Promise<WarehouseMovementRow[]>}
 * @throws {AppError} Normalized database error if the query fails.
 */
const getWarehouseMovementsByInventoryId = async (inventoryId) => {
  const context = `${CONTEXT}/getWarehouseMovementsByInventoryId`;
  const params = [inventoryId];
  
  try {
    const { rows } = await query(WAREHOUSE_MOVEMENTS_BY_INVENTORY_ID_QUERY, params);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch warehouse movements.',
      meta:    { inventoryId },
      logFn:   (err) => logDbQueryError(
        WAREHOUSE_MOVEMENTS_BY_INVENTORY_ID_QUERY, params, err, { context }
      ),
    });
  }
};

module.exports = {
  getWarehouseMovementsByInventoryId,
};

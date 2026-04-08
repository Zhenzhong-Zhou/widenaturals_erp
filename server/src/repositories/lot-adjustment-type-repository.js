/**
 * @file lot-adjustment-type-repository.js
 * @description Database access layer for lot adjustment type records.
 *
 * Follows the established repo pattern:
 *  - Query factories imported from lot-adjustment-type-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getLotAdjustmentTypeLookup — fetch active lot adjustment types with optional filtering
 */

'use strict';

const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildLotAdjustmentWhereClause } = require('../utils/sql/build-lot-adjustment-type-filter');
const { buildLotAdjustmentTypeLookupQuery } = require('./queries/lot-adjustment-type-queries');

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches active lot adjustment types for dropdown/lookup use.
 *
 * Always filters to active records only (lat.is_active = true).
 * Supports optional restriction to quantity adjustment category
 * and exclusion of internal-only types.
 *
 * @param {Object}  [filters={}]
 * @param {boolean} [filters.restrictToQtyAdjustment] - If true, restricts to iat.category = 'adjustment'.
 * @param {boolean} [filters.excludeInternal]         - If true, excludes internal stock management types.
 *
 * @returns {Promise<Array<{ lot_adjustment_type_id: string, inventory_action_type_id: string, name: string }>>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getLotAdjustmentTypeLookup = async (filters = {}) => {
  const context = 'lot-adjustment-type-repository/getLotAdjustmentTypeLookup';
  
  const { whereClause, params } = buildLotAdjustmentWhereClause(filters);
  const queryText = buildLotAdjustmentTypeLookupQuery(whereClause);
  
  try {
    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch lot adjustment type lookup.',
      meta:    { filters },
      logFn:   (err) => logDbQueryError(
        queryText,
        params,
        err,
        { context, filters }
      ),
    });
  }
};

module.exports = {
  getLotAdjustmentTypeLookup,
};

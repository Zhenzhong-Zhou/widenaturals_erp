/**
 * @fileoverview build-lot-adjustment-where-clause.js
 * Utility to dynamically construct SQL WHERE clause and parameter array for filtering lot adjustment types.
 * Filters by default to active types and category 'adjustment', with optional exclusions.
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a WHERE clause and parameters for fetching valid lot adjustment types.
 *
 * @param {Object} [filters={}] - Optional filter settings.
 * @param {boolean} [filters.excludeInternal=false] - Whether to exclude internal-only adjustments (e.g., manual inserts).
 * @param {boolean} [filters.restrictToQtyAdjustment=false] - Whether to restrict results to inventory quantity adjustment types (i.e., those with category = 'adjustment').
 * @returns {{ whereClause: string, params: Array<any> }} SQL-safe clause and parameters.
 */
const buildLotAdjustmentWhereClause = (filters = {}) => {
  try {
    const conditions = [`lat.is_active = true`];
    const params = [];

    if (filters.restrictToQtyAdjustment) {
      conditions.push(`iat.category = 'adjustment'`);
    }

    if (filters.excludeInternal) {
      conditions.push(
        `lat.name NOT IN ('manual_stock_insert', 'manual_stock_update')`
      );
    }

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build lot adjustment filter clause', {
      context: 'lot-adjustment-type-repository/buildLotAdjustmentWhereClause',
      error: err.message,
      filters,
    });

    throw AppError.transformerError('Failed to prepare adjustment filters', {
      details: err.message,
      stage: 'build-lot-adjustment-where',
    });
  }
};

module.exports = {
  buildLotAdjustmentWhereClause,
};

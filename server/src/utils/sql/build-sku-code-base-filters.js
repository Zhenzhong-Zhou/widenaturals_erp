/**
 * @fileoverview
 * Utility to build dynamic SQL WHERE clauses and parameter arrays
 * for filtering SKU code base records in dropdowns, SKU creation flows,
 * or admin search screens.
 *
 * Supports:
 * - Exact match filters (brand_code, category_code, status_id)
 * - Fuzzy keyword search (brand_code/category_code)
 * - Date filtering (created_at and status_date ranges)
 * - Fallback status enforcement for permission-based filtering
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a secure dynamic WHERE clause for filtering SKU code base records.
 *
 * @param {Object} [filters={}] - The optional filters.
 * @param {string} [filters.brand_code] - Exact match brand code.
 * @param {string} [filters.category_code] - Exact match category code.
 * @param {string} [filters.status_id] - Match by status id.
 * @param {string} [filters._activeStatusId] - Fallback enforced status.
 * @param {string} [filters.keyword] - Fuzzy keyword search.
 * @param {string} [filters.createdAfter] - created_at >= ISO timestamp.
 * @param {string} [filters.createdBefore] - created_at <= ISO timestamp.
 * @param {string} [filters.statusDateAfter] - status_date >= ISO timestamp.
 * @param {string} [filters.statusDateBefore] - status_date <= ISO timestamp.
 *
 * @returns {{ whereClause: string, params: any[] }}
 *
 * @throws {AppError} If filter construction fails.
 */
const buildSkuCodeBaseFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;

    // ----- brand_code -----
    if (filters.brand_code) {
      conditions.push(`scb.brand_code = $${paramIndex}`);
      params.push(filters.brand_code);
      paramIndex++;
    }

    // ----- category_code -----
    if (filters.category_code) {
      conditions.push(`scb.category_code = $${paramIndex}`);
      params.push(filters.category_code);
      paramIndex++;
    }

    // ----- keyword search (brand_code / category_code) -----
    if (filters.keyword) {
      const fuzzy = `%${filters.keyword}%`;
      conditions.push(`
        (
          scb.brand_code ILIKE $${paramIndex}
          OR scb.category_code ILIKE $${paramIndex}
        )
      `);
      params.push(fuzzy);
      paramIndex++;
    }

    // ----- status filters -----
    if (filters.status_id) {
      conditions.push(`scb.status_id = $${paramIndex}`);
      params.push(filters.status_id);
      paramIndex++;
    } else if (filters._activeStatusId) {
      // fallback enforcement
      conditions.push(`scb.status_id = $${paramIndex}`);
      params.push(filters._activeStatusId);
      paramIndex++;
    }

    // ----- date filters -----
    if (filters.createdAfter) {
      conditions.push(`scb.created_at >= $${paramIndex}`);
      params.push(filters.createdAfter);
      paramIndex++;
    }

    if (filters.createdBefore) {
      conditions.push(`scb.created_at <= $${paramIndex}`);
      params.push(filters.createdBefore);
      paramIndex++;
    }

    if (filters.statusDateAfter) {
      conditions.push(`scb.status_date >= $${paramIndex}`);
      params.push(filters.statusDateAfter);
      paramIndex++;
    }

    if (filters.statusDateBefore) {
      conditions.push(`scb.status_date <= $${paramIndex}`);
      params.push(filters.statusDateBefore);
      paramIndex++;
    }

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build SKU code base filter', {
      context: 'sku-code-base-repository/buildSkuCodeBaseFilter',
      filters,
      error: err.message,
    });

    throw AppError.databaseError('Failed to prepare SKU code base filter', {
      details: err.message,
      stage: 'build-sku-code-base-where-clause',
    });
  }
};

module.exports = {
  buildSkuCodeBaseFilter,
};

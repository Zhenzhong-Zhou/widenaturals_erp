/**
 * @fileoverview build-status-lookup-filters.js
 * Utility to dynamically construct SQL WHERE clauses + params
 * for status lookup endpoints.
 *
 * Supports exact matching, keyword fuzzy search, and boolean filters.
 */

const { addIlikeFilter } = require('./sql-helpers');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Build WHERE clause + parameter array for status lookup.
 *
 * Supported filters:
 *   - id
 *   - name (exact or ilike)
 *   - keyword (multi-field fuzzy match)
 *   - is_active
 *
 * @param {Object} filters
 * @param {string} [filters.id]
 * @param {string} [filters.name]
 * @param {string} [filters.name_ilike]
 * @param {string} [filters.keyword]
 * @param {boolean} [filters.is_active]
 *
 * @returns {{ whereClause: string, params: any[] }}
 */
const buildStatusLookupFilters = (filters = {}) => {
  try {
    /** @type {string[]} */
    const conditions = ['1=1'];

    /** @type {any[]} */
    const params = [];

    /** @type {number} */
    let idx = 1;

    // -------------------------------------------------------------
    // EXACT MATCH: id
    // -------------------------------------------------------------
    if (filters.id) {
      conditions.push(`s.id = $${idx}`);
      params.push(filters.id);
      idx++;
    }

    // -------------------------------------------------------------
    // BOOLEAN: is_active
    // -------------------------------------------------------------
    if (typeof filters.is_active === 'boolean') {
      conditions.push(`s.is_active = $${idx}`);
      params.push(filters.is_active);
      idx++;
    }

    // -------------------------------------------------------------
    // NAME: support both exact + ilike
    // -------------------------------------------------------------
    if (filters.name) {
      // exact match
      conditions.push(`s.name = $${idx}`);
      params.push(filters.name);
      idx++;
    }

    // allow ilike match (same field)
    idx = addIlikeFilter(conditions, params, idx, filters.name_ilike, 's.name');

    // -------------------------------------------------------------
    // KEYWORD: fuzzy search across name + description
    // -------------------------------------------------------------
    if (filters.keyword) {
      const kw = `%${filters.keyword.trim().replace(/\s+/g, ' ')}%`;

      conditions.push(`
        (
          s.name ILIKE $${idx}
          OR s.description ILIKE $${idx}
        )
      `);

      params.push(kw);
      idx++;
    }

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build Status Lookup filter', {
      context: 'lookup/buildStatusLookupFilters',
      error: err.message,
      filters,
    });

    throw AppError.databaseError('Failed to build Status lookup filters', {
      details: err.message,
    });
  }
};

module.exports = {
  buildStatusLookupFilters,
};

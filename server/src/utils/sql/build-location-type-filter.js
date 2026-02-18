/**
 * @fileoverview build-location-type-filter.js
 *
 * Helper for constructing SQL WHERE clauses and parameter arrays used in
 * repository-layer location type list and lookup queries.
 *
 * This module is responsible strictly for row-level filtering logic.
 * It does NOT perform permission checks. All visibility and capability
 * decisions must be resolved by the service / ACL layer and passed
 * explicitly via filter flags or options.
 *
 * Design principles:
 * - Support ACTIVE-only enforcement
 * - Support explicit status filtering
 * - Support keyword-based fuzzy search
 * - Maintain deterministic parameter indexing ($1, $2, ...)
 * - Keep repository filtering isolated from business rules
 */

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { addIlikeFilter } = require('./sql-helpers');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * @fileoverview build-location-type-filter.js
 *
 * Helper for constructing SQL WHERE clauses and parameter arrays used in
 * repository-layer location type list and lookup queries.
 *
 * This module is responsible strictly for row-level filtering logic.
 * It does NOT perform permission checks. All visibility and enforcement
 * decisions must be resolved by the service / ACL layer and passed
 * explicitly via sanitized filter flags.
 *
 * ------------------------------------------------------------------
 * Design Principles
 * ------------------------------------------------------------------
 * - Keep filtering logic isolated from business rules
 * - Enforce ACTIVE-only constraints at SQL level when required
 * - Maintain deterministic parameter indexing ($1, $2, ...)
 * - Keep query shaping independent from ACL evaluation
 * - Support join-aware keyword expansion when permitted
 *
 * ------------------------------------------------------------------
 * Status Visibility
 * ------------------------------------------------------------------
 * @param {boolean} [filters.enforceActiveOnly=false]
 *   When TRUE and no explicit `statusIds` are provided,
 *   results are limited to ACTIVE location types.
 *
 * @param {string} [filters.activeStatusId]
 *   UUID of the ACTIVE status.
 *   Required when `enforceActiveOnly` is enabled.
 *   Must be resolved and injected by the service layer.
 *
 * @param {string[]} [filters.statusIds]
 *   Explicit status UUID filters.
 *   When provided, overrides ACTIVE-only enforcement.
 *
 * ------------------------------------------------------------------
 * Direct Field Filters (lt)
 * ------------------------------------------------------------------
 * @param {string} [filters.name]
 *   ILIKE match on location type name.
 *
 * @param {string} [filters.code]
 *   ILIKE match on location type code.
 *
 * ------------------------------------------------------------------
 * Audit Filters
 * ------------------------------------------------------------------
 * @param {string} [filters.createdBy]
 *   UUID of creator.
 *
 * @param {string} [filters.updatedBy]
 *   UUID of last updater.
 *
 * @param {string} [filters.createdAfter]
 *   ISO timestamp (>=).
 *
 * @param {string} [filters.createdBefore]
 *   ISO timestamp (<=).
 *
 * @param {string} [filters.updatedAfter]
 *   ISO timestamp (>=).
 *
 * @param {string} [filters.updatedBefore]
 *   ISO timestamp (<=).
 *
 * ------------------------------------------------------------------
 * Keyword Fuzzy Search
 * ------------------------------------------------------------------
 * @param {string} [filters.keyword]
 *   Performs ILIKE-based fuzzy search across permitted fields
 *   (e.g. name, code).
 *
 * ------------------------------------------------------------------
 * Return
 * ------------------------------------------------------------------
 * {
 *   whereClause: '1=1 AND lt.status_id = ... AND ...',
 *   params: [...]
 * }
 *
 * @returns {{ whereClause: string, params: any[] }}
 *
 * @throws {AppError}
 *   When filter preparation fails
 */
const buildLocationTypeFilter = (filters = {}, options = {}) => {
  try {
    // -------------------------------------------------------------
    // Normalize date range filters
    // -------------------------------------------------------------
    filters = normalizeDateRangeFilters(
      filters,
      'createdAfter',
      'createdBefore'
    );

    filters = normalizeDateRangeFilters(
      filters,
      'updatedAfter',
      'updatedBefore'
    );

    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };

    const enforceActiveOnly = filters.enforceActiveOnly === true;
    const hasStatusFilter =
      Array.isArray(filters.statusIds) && filters.statusIds.length > 0;

    const { canSearchStatus = false } = options;

    // -------------------------------------------------------------
    // ACTIVE-only enforcement
    // -------------------------------------------------------------
    if (enforceActiveOnly && !hasStatusFilter && filters.activeStatusId) {
      conditions.push(`lt.status_id = $${paramIndexRef.value}`);
      params.push(filters.activeStatusId);
      paramIndexRef.value++;
    }

    // -------------------------------------------------------------
    // Explicit status filter
    // -------------------------------------------------------------
    if (filters.statusIds?.length) {
      conditions.push(`lt.status_id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.statusIds);
      paramIndexRef.value++;
    }

    // -------------------------------------------------------------
    // Audit filters
    // -------------------------------------------------------------
    if (filters.createdBy) {
      conditions.push(`lt.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }

    if (filters.updatedBy) {
      conditions.push(`lt.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }

    // -------------------------------------------------------------
    // Date filters
    // -------------------------------------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'lt.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });

    applyDateRangeConditions({
      conditions,
      params,
      column: 'lt.updated_at',
      after: filters.updatedAfter,
      before: filters.updatedBefore,
      paramIndexRef,
    });

    // -------------------------------------------------------------
    // Direct text filters
    // -------------------------------------------------------------
    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.name,
      'lt.name'
    );

    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.code,
      'lt.code'
    );

    // -------------------------------------------------------------
    // Keyword search
    // -------------------------------------------------------------
    if (filters.keyword) {
      const keywordValue = `%${filters.keyword}%`;

      const keywordConditions = [
        `lt.name ILIKE $${paramIndexRef.value}`,
        `lt.code ILIKE $${paramIndexRef.value}`,
      ];

      if (canSearchStatus) {
        keywordConditions.push(`s.name ILIKE $${paramIndexRef.value}`);
      }

      conditions.push(`(${keywordConditions.join(' OR ')})`);
      params.push(keywordValue);
      paramIndexRef.value++;
    }

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build location type filter', {
      context: 'location-type-repository/buildLocationTypeFilter',
      filters,
    });

    throw AppError.databaseError('Failed to prepare location type filter', {
      details: err.message,
    });
  }
};

module.exports = {
  buildLocationTypeFilter,
};

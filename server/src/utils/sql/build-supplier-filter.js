/**
 * @fileoverview build-supplier-filter.js
 *
 * Helper for constructing SQL WHERE clauses and parameter arrays used in
 * repository-layer supplier list and lookup queries.
 *
 * This module is responsible strictly for row-level filtering logic.
 * It does NOT perform permission checks. All visibility and capability
 * decisions must be resolved by the service / ACL layer.
 *
 * Design principles:
 * - Enforce archive visibility at SQL level
 * - Support ACTIVE-only restriction
 * - Support join-aware keyword search
 * - Maintain deterministic positional parameter indexing
 * - Keep repository filtering isolated from business logic
 */

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { addIlikeFilter } = require('./sql-helpers');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Build SQL WHERE clause and parameter list for Supplier queries.
 *
 * This helper constructs row-level SQL conditions only.
 * All permission decisions must be resolved by the service layer.
 *
 * @param {Object} [filters={}]
 *   Row-level filter values applied to the supplier table
 *
 * ------------------------------------------------------------------
 * Archive Visibility
 * ------------------------------------------------------------------
 * @param {boolean} [filters.includeArchived=false]
 *   - When TRUE, archived suppliers are included
 *   - When FALSE (default), `s.is_archived = FALSE` is enforced
 *
 * ------------------------------------------------------------------
 * Status Visibility
 * ------------------------------------------------------------------
 * @param {boolean} [filters.enforceActiveOnly=false]
 *   - When TRUE and no explicit statusIds are provided,
 *     results are limited to ACTIVE suppliers
 *
 * @param {string} [filters.activeStatusId]
 *   - UUID of ACTIVE status (required when enforceActiveOnly = true)
 *
 * @param {string[]} [filters.statusIds]
 *   - Filter by supplier status UUID(s)
 *
 * ------------------------------------------------------------------
 * Location Filters
 * ------------------------------------------------------------------
 * @param {string[]} [filters.locationIds]
 *   - Filter by associated location UUID(s)
 *
 * ------------------------------------------------------------------
 * Supplier-level Filters (`s`)
 * ------------------------------------------------------------------
 * @param {string} [filters.name]
 *   - ILIKE match on supplier name
 *
 * @param {string} [filters.code]
 *   - ILIKE match on supplier code
 *
 * @param {string} [filters.contactName]
 *   - ILIKE match on contact_name
 *
 * @param {string} [filters.contactEmail]
 *   - ILIKE match on contact_email
 *
 * ------------------------------------------------------------------
 * Audit Filters
 * ------------------------------------------------------------------
 * @param {string} [filters.createdBy]
 *   - UUID of creator
 *
 * @param {string} [filters.updatedBy]
 *   - UUID of last updater
 *
 * @param {string} [filters.createdAfter]
 *   - ISO timestamp (>=)
 *
 * @param {string} [filters.createdBefore]
 *   - ISO timestamp (<=)
 *
 * @param {string} [filters.updatedAfter]
 *   - ISO timestamp (>=)
 *
 * @param {string} [filters.updatedBefore]
 *   - ISO timestamp (<=)
 *
 * ------------------------------------------------------------------
 * Keyword fuzzy search
 * ------------------------------------------------------------------
 * @param {string} [filters.keyword]
 *   Performs ILIKE-based fuzzy search across permitted fields
 *
 * ------------------------------------------------------------------
 * Query Capability Options (resolved by ACL layer)
 * ------------------------------------------------------------------
 * @param {Object} [options]
 *
 * @param {boolean} [options.canSearchStatus=false]
 *   When TRUE, keyword search may include status name (`st.name`)
 *   Requires calling query to JOIN the status table
 *
 * @param {boolean} [options.canSearchLocation=false]
 *   When TRUE, keyword search may include location name (`l.name`)
 *   Requires calling query to JOIN the locations table
 *
 * ------------------------------------------------------------------
 * Return
 * ------------------------------------------------------------------
 * {
 *   whereClause: '1=1 AND s.is_archived = FALSE AND ...',
 *   params: [...]
 * }
 *
 * @returns {{ whereClause: string, params: any[] }}
 *
 * @throws {AppError} When filter preparation fails
 */
const buildSupplierFilter = (filters = {}, options = {}) => {
  try {
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

    const includeArchived = filters.includeArchived === true;
    const enforceActiveOnly = filters.enforceActiveOnly === true;
    const hasStatusFilter =
      Array.isArray(filters.statusIds) && filters.statusIds.length > 0;

    const { canSearchStatus = false, canSearchLocation = false } = options;

    if (!includeArchived) {
      conditions.push('s.is_archived = FALSE');
    }

    if (enforceActiveOnly && !hasStatusFilter && filters.activeStatusId) {
      conditions.push(`s.status_id = $${paramIndexRef.value}`);
      params.push(filters.activeStatusId);
      paramIndexRef.value++;
    }

    if (filters.statusIds?.length) {
      conditions.push(`s.status_id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.statusIds);
      paramIndexRef.value++;
    }

    if (filters.locationIds?.length) {
      conditions.push(`s.location_id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.locationIds);
      paramIndexRef.value++;
    }

    if (filters.createdBy) {
      conditions.push(`s.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }

    if (filters.updatedBy) {
      conditions.push(`s.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }

    applyDateRangeConditions({
      conditions,
      params,
      column: 's.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });

    applyDateRangeConditions({
      conditions,
      params,
      column: 's.updated_at',
      after: filters.updatedAfter,
      before: filters.updatedBefore,
      paramIndexRef,
    });

    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.name,
      's.name'
    );

    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.code,
      's.code'
    );

    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.contactName,
      's.contact_name'
    );

    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.contactEmail,
      's.contact_email'
    );

    if (filters.keyword) {
      const keywordConditions = [
        `s.name ILIKE $${paramIndexRef.value}`,
        `s.code ILIKE $${paramIndexRef.value}`,
        `s.contact_name ILIKE $${paramIndexRef.value}`,
        `s.contact_email ILIKE $${paramIndexRef.value}`,
      ];

      if (canSearchStatus) {
        keywordConditions.push(`st.name ILIKE $${paramIndexRef.value}`);
      }

      if (canSearchLocation) {
        keywordConditions.push(`l.name ILIKE $${paramIndexRef.value}`);
      }

      conditions.push(`(${keywordConditions.join(' OR ')})`);
      params.push(`%${filters.keyword}%`);
      paramIndexRef.value++;
    }

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build supplier filter', {
      context: 'supplier-repository/buildSupplierFilter',
      filters,
    });

    throw AppError.databaseError('Failed to prepare supplier filter', {
      details: err.message,
    });
  }
};

module.exports = {
  buildSupplierFilter,
};

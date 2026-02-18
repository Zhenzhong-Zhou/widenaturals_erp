/**
 * @fileoverview build-manufacturer-filter.js
 *
 * Helper for constructing SQL WHERE clauses and parameter arrays used in
 * repository-layer manufacturer list and lookup queries.
 *
 * This module is responsible strictly for row-level filtering logic.
 * It does NOT perform permission checks. All capability decisions must
 * be resolved by the service / ACL layer and passed explicitly via options.
 *
 * Design principles:
 * - Enforce archive visibility at SQL level
 * - Support optional ACTIVE-only enforcement
 * - Keep keyword search join-aware but not join-dependent
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
 * Build SQL WHERE clause and parameter list for Manufacturer queries.
 *
 * This helper is used by repository-layer queries and constructs
 * row-level filtering conditions only.
 *
 * It does NOT perform permission checks. The service layer must:
 * - Decide whether archived records are visible
 * - Resolve ACTIVE status ID when enforceActiveOnly is enabled
 * - Decide which JOIN capabilities are permitted
 *
 * @param {Object} [filters={}]
 *   Row-level filter values applied to the manufacturer table
 *
 * ------------------------------------------------------------------
 * Archive Visibility
 * ------------------------------------------------------------------
 * @param {boolean} [filters.includeArchived=false]
 *   - When TRUE, archived manufacturers are included
 *   - When FALSE (default), `m.is_archived = FALSE` is enforced
 *
 * ------------------------------------------------------------------
 * Status Visibility
 * ------------------------------------------------------------------
 * @param {boolean} [filters.enforceActiveOnly=false]
 *   - When TRUE and no explicit statusIds are provided,
 *     results are limited to ACTIVE manufacturers
 *
 * @param {string} [filters.activeStatusId]
 *   - UUID of ACTIVE status (required when enforceActiveOnly = true)
 *
 * @param {string[]} [filters.statusIds]
 *   - Filter by manufacturer status UUID(s)
 *
 * ------------------------------------------------------------------
 * Location Filters
 * ------------------------------------------------------------------
 * @param {string[]} [filters.locationIds]
 *   - Filter by associated location UUID(s)
 *
 * ------------------------------------------------------------------
 * Manufacturer-level Filters (`m`)
 * ------------------------------------------------------------------
 * @param {string} [filters.name]
 *   - ILIKE match on manufacturer name
 *
 * @param {string} [filters.code]
 *   - ILIKE match on manufacturer code
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
 *   When TRUE, keyword search may include status name (`s.name`)
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
 *   whereClause: '1=1 AND m.is_archived = FALSE AND ...',
 *   params: [...]
 * }
 *
 * @returns {{ whereClause: string, params: any[] }}
 *
 * @throws {AppError} When filter preparation fails
 */
const buildManufacturerFilter = (filters = {}, options = {}) => {
  try {
    // -------------------------------------------------------------
    // Normalize UI date filters
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

    const includeArchived = filters.includeArchived === true;
    const enforceActiveOnly = filters.enforceActiveOnly === true;
    const hasStatusFilter =
      Array.isArray(filters.statusIds) && filters.statusIds.length > 0;

    const { canSearchStatus = false, canSearchLocation = false } = options;

    // -------------------------------------------------------------
    // Archive visibility
    // -------------------------------------------------------------
    if (!includeArchived) {
      conditions.push('m.is_archived = FALSE');
    }

    // -------------------------------------------------------------
    // Status visibility
    // -------------------------------------------------------------
    if (enforceActiveOnly && !hasStatusFilter && filters.activeStatusId) {
      conditions.push(`m.status_id = $${paramIndexRef.value}`);
      params.push(filters.activeStatusId);
      paramIndexRef.value++;
    }

    if (filters.statusIds?.length) {
      conditions.push(`m.status_id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.statusIds);
      paramIndexRef.value++;
    }

    // -------------------------------------------------------------
    // Location filter
    // -------------------------------------------------------------
    if (filters.locationIds?.length) {
      conditions.push(`m.location_id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.locationIds);
      paramIndexRef.value++;
    }

    // -------------------------------------------------------------
    // Audit filters
    // -------------------------------------------------------------
    if (filters.createdBy) {
      conditions.push(`m.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }

    if (filters.updatedBy) {
      conditions.push(`m.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }

    // -------------------------------------------------------------
    // Date filters
    // -------------------------------------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'm.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });

    applyDateRangeConditions({
      conditions,
      params,
      column: 'm.updated_at',
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
      'm.name'
    );

    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.code,
      'm.code'
    );

    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.contactName,
      'm.contact_name'
    );

    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.contactEmail,
      'm.contact_email'
    );

    // -------------------------------------------------------------
    // Keyword search (permission-aware)
    // -------------------------------------------------------------
    if (filters.keyword) {
      const keywordConditions = [
        `m.name ILIKE $${paramIndexRef.value}`,
        `m.code ILIKE $${paramIndexRef.value}`,
        `m.contact_name ILIKE $${paramIndexRef.value}`,
        `m.contact_email ILIKE $${paramIndexRef.value}`,
      ];

      if (canSearchStatus) {
        keywordConditions.push(`s.name ILIKE $${paramIndexRef.value}`);
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
    logSystemException(err, 'Failed to build manufacturer filter', {
      context: 'manufacturer-repository/buildManufacturerFilter',
      filters,
    });

    throw AppError.databaseError('Failed to prepare manufacturer filter', {
      details: err.message,
    });
  }
};

module.exports = {
  buildManufacturerFilter,
};

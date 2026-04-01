/**
 * @file build-location-filter.js
 * @description SQL WHERE clause builder for location queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * Exports:
 *  - buildLocationFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for location queries.
 *
 * Normalizes date range filters to UTC ISO boundaries before applying conditions.
 * Archived locations are excluded by default — pass includeArchived: true to include them.
 *
 * Status resolution priority:
 *  1. statusIds (array)   — explicit multi-status filter
 *  2. status_id (scalar)  — explicit single-status filter
 *  3. _activeStatusId     — server-injected fallback for visibility enforcement
 *
 * Location type resolution follows the same priority pattern:
 *  1. locationTypeIds (array) — multiple type filter
 *  2. locationTypeId (scalar) — single type filter
 *
 * @param {Object}   [filters={}]
 * @param {boolean}  [filters.includeArchived]     - If true, include archived locations.
 * @param {string[]} [filters.statusIds]           - Filter by status UUIDs (array takes priority).
 * @param {string}   [filters.status_id]           - Filter by status UUID (scalar fallback).
 * @param {string}   [filters._activeStatusId]     - Server-injected status fallback.
 * @param {string[]} [filters.locationTypeIds]     - Filter by location type UUIDs (array takes priority).
 * @param {string}   [filters.locationTypeId]      - Filter by location type UUID (scalar fallback).
 * @param {string}   [filters.city]                - ILIKE filter on city.
 * @param {string}   [filters.province_or_state]   - ILIKE filter on province or state.
 * @param {string}   [filters.country]             - ILIKE filter on country.
 * @param {string}   [filters.createdBy]           - Filter by creator user UUID.
 * @param {string}   [filters.updatedBy]           - Filter by updater user UUID.
 * @param {string}   [filters.createdAfter]        - Lower bound for created_at (inclusive, UTC).
 * @param {string}   [filters.createdBefore]       - Upper bound for created_at (exclusive, UTC).
 * @param {string}   [filters.updatedAfter]        - Lower bound for updated_at (inclusive, UTC).
 * @param {string}   [filters.updatedBefore]       - Upper bound for updated_at (exclusive, UTC).
 * @param {string}   [filters.keyword]             - ILIKE search across name, address, city, region, postal, country.
 *
 * @returns {{ whereClause: string, params: Array }} Parameterised WHERE clause and bound values.
 */
const buildLocationFilter = (filters = {}) => {
  // Normalize all date ranges — handles both raw strings and Joi-coerced Date objects.
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'updatedAfter', 'updatedBefore'
  );
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  // ─── Archive ─────────────────────────────────────────────────────────────────
  
  // Exclude archived by default — caller must explicitly opt in.
  if (!normalizedFilters.includeArchived) {
    conditions.push(`l.is_archived = false`);
  }
  
  // ─── Status ──────────────────────────────────────────────────────────────────
  
  // Priority: statusIds (array) → status_id (scalar) → _activeStatusId (server fallback)
  const statusFilterValue =
    normalizedFilters.statusIds?.length  ? normalizedFilters.statusIds  :
      normalizedFilters.status_id          ? normalizedFilters.status_id  :
        normalizedFilters._activeStatusId;
  
  if (statusFilterValue != null) {
    conditions.push(
      Array.isArray(statusFilterValue)
        ? `l.status_id = ANY($${paramIndexRef.value}::uuid[])`
        : `l.status_id = $${paramIndexRef.value}`
    );
    params.push(statusFilterValue);
    paramIndexRef.value++;
  }
  
  // ─── Location Type ────────────────────────────────────────────────────────────
  
  // Priority: locationTypeIds (array) → locationTypeId (scalar)
  const locationTypeFilterValue =
    normalizedFilters.locationTypeIds?.length ? normalizedFilters.locationTypeIds :
      normalizedFilters.locationTypeId;
  
  if (locationTypeFilterValue != null) {
    conditions.push(
      Array.isArray(locationTypeFilterValue)
        ? `l.location_type_id = ANY($${paramIndexRef.value}::uuid[])`
        : `l.location_type_id = $${paramIndexRef.value}`
    );
    params.push(locationTypeFilterValue);
    paramIndexRef.value++;
  }
  
  // ─── Geography ───────────────────────────────────────────────────────────────
  
  if (normalizedFilters.city) {
    conditions.push(`l.city ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.city}%`);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.province_or_state) {
    conditions.push(`l.province_or_state ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.province_or_state}%`);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.country) {
    conditions.push(`l.country ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.country}%`);
    paramIndexRef.value++;
  }
  
  // ─── Audit ──────────────────────────────────────────────────────────────────
  
  if (normalizedFilters.createdBy) {
    conditions.push(`l.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.updatedBy) {
    conditions.push(`l.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }
  
  // ─── Date Range ─────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'l.created_at',
    after:         normalizedFilters.createdAfter,
    before:        normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'l.updated_at',
    after:         normalizedFilters.updatedAfter,
    before:        normalizedFilters.updatedBefore,
    paramIndexRef,
  });
  
  // ─── Keyword (must remain last) ──────────────────────────────────────────────
  
  // Same $N referenced across all search fields — single param covers all columns.
  if (normalizedFilters.keyword) {
    const searchFields = [
      'l.name',
      'l.address_line1',
      'l.address_line2',
      'l.city',
      'l.province_or_state',
      'l.postal_code',
      'l.country',
    ];
    
    conditions.push(`(${
      searchFields.map((f) => `${f} ILIKE $${paramIndexRef.value}`).join(' OR ')
    })`);
    params.push(`%${normalizedFilters.keyword}%`);
    paramIndexRef.value++;
  }
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildLocationFilter,
};

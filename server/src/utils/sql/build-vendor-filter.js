/**
 * @file build-vendor-filter.js
 * @description Shared SQL WHERE clause builder for vendor-type domains
 * (manufacturers, suppliers) that share identical filter structure.
 *
 * Called by domain-specific wrappers that supply the table alias and
 * keyword join fields. Not exported for direct use — use the domain
 * wrappers instead.
 *
 * Exports:
 *  - buildVendorFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { addIlikeFilter } = require('./sql-helpers');

/**
 * Builds a parameterised SQL WHERE clause for vendor-type queries.
 *
 * @param {string}   alias          - Table alias used in the query (e.g. 'm', 's').
 * @param {Object}   [filters={}]
 * @param {boolean}  [filters.includeArchived]      - If true, include archived records.
 * @param {boolean}  [filters.enforceActiveOnly]    - If true and no statusIds, restrict to activeStatusId.
 * @param {string}   [filters.activeStatusId]       - Server-injected active status UUID.
 * @param {string[]} [filters.statusIds]            - Explicit status UUID filter.
 * @param {string[]} [filters.locationIds]          - Filter by location UUIDs.
 * @param {string}   [filters.createdBy]            - Filter by creator UUID.
 * @param {string}   [filters.updatedBy]            - Filter by updater UUID.
 * @param {string}   [filters.createdAfter]         - Lower bound for created_at (inclusive, UTC).
 * @param {string}   [filters.createdBefore]        - Upper bound for created_at (exclusive, UTC).
 * @param {string}   [filters.updatedAfter]         - Lower bound for updated_at (inclusive, UTC).
 * @param {string}   [filters.updatedBefore]        - Upper bound for updated_at (exclusive, UTC).
 * @param {string}   [filters.name]                 - ILIKE filter on name.
 * @param {string}   [filters.code]                 - ILIKE filter on code.
 * @param {string}   [filters.contactName]          - ILIKE filter on contact name.
 * @param {string}   [filters.contactEmail]         - ILIKE filter on contact email.
 * @param {string}   [filters.keyword]              - Fuzzy search across name, code, contact fields.
 * @param {Object}   [options={}]
 * @param {boolean}  [options.canSearchStatus=false]   - Include status name in keyword search.
 * @param {boolean}  [options.canSearchLocation=false] - Include location name in keyword search.
 * @param {string}   [options.statusAlias='s']         - Join alias for the status table.
 * @param {string}   [options.locationAlias='l']       - Join alias for the locations table.
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildVendorFilter = (alias, filters = {}, options = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'updatedAfter', 'updatedBefore'
  );
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  const {
    canSearchStatus  = false,
    canSearchLocation = false,
    statusAlias      = 's',
    locationAlias    = 'l',
  } = options;
  
  const a = alias;
  const includeArchived   = normalizedFilters.includeArchived === true;
  const enforceActiveOnly = normalizedFilters.enforceActiveOnly === true;
  const hasStatusFilter   = Array.isArray(normalizedFilters.statusIds) &&
    normalizedFilters.statusIds.length > 0;
  
  // ─── Archive ─────────────────────────────────────────────────────────────────
  
  if (!includeArchived) {
    conditions.push(`${a}.is_archived = FALSE`);
  }
  
  // ─── Status ──────────────────────────────────────────────────────────────────
  
  if (enforceActiveOnly && !hasStatusFilter && normalizedFilters.activeStatusId) {
    conditions.push(`${a}.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.activeStatusId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.statusIds?.length) {
    conditions.push(`${a}.status_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.statusIds);
    paramIndexRef.value++;
  }
  
  // ─── Location ────────────────────────────────────────────────────────────────
  
  if (normalizedFilters.locationIds?.length) {
    conditions.push(`${a}.location_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.locationIds);
    paramIndexRef.value++;
  }
  
  // ─── Audit ──────────────────────────────────────────────────────────────────
  
  if (normalizedFilters.createdBy) {
    conditions.push(`${a}.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.updatedBy) {
    conditions.push(`${a}.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }
  
  // ─── Date Range ─────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions, params,
    column:        `${a}.created_at`,
    after:         normalizedFilters.createdAfter,
    before:        normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyDateRangeConditions({
    conditions, params,
    column:        `${a}.updated_at`,
    after:         normalizedFilters.updatedAfter,
    before:        normalizedFilters.updatedBefore,
    paramIndexRef,
  });
  
  // ─── Text ────────────────────────────────────────────────────────────────────
  
  paramIndexRef.value = addIlikeFilter(conditions, params, paramIndexRef.value, normalizedFilters.name,         `${a}.name`);
  paramIndexRef.value = addIlikeFilter(conditions, params, paramIndexRef.value, normalizedFilters.code,         `${a}.code`);
  paramIndexRef.value = addIlikeFilter(conditions, params, paramIndexRef.value, normalizedFilters.contactName,  `${a}.contact_name`);
  paramIndexRef.value = addIlikeFilter(conditions, params, paramIndexRef.value, normalizedFilters.contactEmail, `${a}.contact_email`);
  
  // ─── Keyword (must remain last) ──────────────────────────────────────────────
  
  if (normalizedFilters.keyword) {
    const keywordConditions = [
      `${a}.name          ILIKE $${paramIndexRef.value}`,
      `${a}.code          ILIKE $${paramIndexRef.value}`,
      `${a}.contact_name  ILIKE $${paramIndexRef.value}`,
      `${a}.contact_email ILIKE $${paramIndexRef.value}`,
    ];
    
    if (canSearchStatus)   keywordConditions.push(`${statusAlias}.name   ILIKE $${paramIndexRef.value}`);
    if (canSearchLocation) keywordConditions.push(`${locationAlias}.name ILIKE $${paramIndexRef.value}`);
    
    conditions.push(`(${keywordConditions.join(' OR ')})`);
    params.push(`%${normalizedFilters.keyword}%`);
    paramIndexRef.value++;
  }
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildVendorFilter,
};

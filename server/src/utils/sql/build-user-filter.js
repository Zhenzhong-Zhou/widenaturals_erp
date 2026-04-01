/**
 * @file build-user-filter.js
 * @description SQL WHERE clause builder for user queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * Exports:
 *  - buildUserFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { addIlikeFilter } = require('./sql-helpers');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for user queries.
 *
 * Normalizes created/updated date range filters to UTC ISO boundaries before
 * applying conditions. Visibility rules (system users, root users,
 * active-only enforcement) are controlled by flags on the filters object
 * set by the service/ACL layer, not by direct user input.
 *
 * @param {Object}  [filters={}]
 * @param {boolean} [filters.includeSystemUsers=false]  - If true, includes rows where is_system = TRUE.
 * @param {boolean} [filters.includeRootUsers=false]    - If true, includes users with root_access permission.
 * @param {boolean} [filters.enforceActiveOnly=false]   - If true, restricts to active status when no statusIds filter is present.
 * @param {string}  [filters.activeStatusId]            - Active status UUID; required when enforceActiveOnly is true.
 * @param {string[]} [filters.statusIds]                - Filter by status UUIDs.
 * @param {string[]} [filters.roleIds]                  - Filter by role UUIDs.
 * @param {string}  [filters.createdBy]                 - Filter by creator user UUID.
 * @param {string}  [filters.updatedBy]                 - Filter by updater user UUID.
 * @param {string}  [filters.createdAfter]              - Lower bound for created_at (inclusive, UTC).
 * @param {string}  [filters.createdBefore]             - Upper bound for created_at (exclusive, UTC).
 * @param {string}  [filters.updatedAfter]              - Lower bound for updated_at (inclusive, UTC).
 * @param {string}  [filters.updatedBefore]             - Upper bound for updated_at (exclusive, UTC).
 * @param {string}  [filters.firstname]                 - ILIKE filter on first name.
 * @param {string}  [filters.lastname]                  - ILIKE filter on last name.
 * @param {string}  [filters.email]                     - ILIKE filter on email.
 * @param {string}  [filters.phoneNumber]               - ILIKE filter on phone number.
 * @param {string}  [filters.jobTitle]                  - ILIKE filter on job title.
 * @param {string}  [filters.keyword]                   - Fuzzy search across name, email, job title, and optionally role/status.
 * @param {Object}  [options={}]                        - Capability flags resolved by the service/ACL layer.
 * @param {boolean} [options.canSearchRole]             - Extend keyword search to include role name.
 * @param {boolean} [options.canSearchStatus]           - Extend keyword search to include status name.
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildUserFilter = (filters = {}, options = {}) => {
  // Normalize date ranges into UTC ISO boundaries — handles both raw date
  // strings and Date objects coerced by Joi's date() type.
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'updatedAfter',
    'updatedBefore'
  );
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  const { canSearchRole = false, canSearchStatus = false } = options;
  
  // ─── Visibility rules (service-controlled flags) ──────────────────────────────
  
  // Hide system users unless the service layer explicitly opts in.
  if (!normalizedFilters.includeSystemUsers) {
    conditions.push('u.is_system = FALSE');
  }
  
  // Hide root users unless the service layer explicitly opts in.
  // Uses NOT EXISTS to avoid a join that would affect row count.
  if (!normalizedFilters.includeRootUsers) {
    conditions.push(`
      NOT EXISTS (
        SELECT 1
        FROM role_permissions rp
        JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role_id = u.role_id
          AND p.key = 'root_access'
      )
    `);
  }
  
  // ─── Status visibility ────────────────────────────────────────────────────────
  
  // Enforce active-only visibility when no explicit statusIds filter is present.
  // statusIds takes precedence — if the caller supplies one, they are already
  // scoping to specific statuses and active-only enforcement would conflict.
  const hasStatusFilter = Array.isArray(normalizedFilters.statusIds) &&
    normalizedFilters.statusIds.length > 0;
  
  if (normalizedFilters.enforceActiveOnly && !hasStatusFilter && normalizedFilters.activeStatusId) {
    conditions.push(`u.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.activeStatusId);
    paramIndexRef.value++;
  }
  
  // ─── Exact-match filters ──────────────────────────────────────────────────────
  
  if (normalizedFilters.statusIds?.length) {
    conditions.push(`u.status_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.statusIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.roleIds?.length) {
    conditions.push(`u.role_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.roleIds);
    paramIndexRef.value++;
  }
  
  // ─── Audit filters ────────────────────────────────────────────────────────────
  
  if (normalizedFilters.createdBy) {
    conditions.push(`u.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.updatedBy) {
    conditions.push(`u.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }
  
  // ─── Date range filters ───────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'u.created_at',
    after:         normalizedFilters.createdAfter,
    before:        normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'u.updated_at',
    after:         normalizedFilters.updatedAfter,
    before:        normalizedFilters.updatedBefore,
    paramIndexRef,
  });
  
  // ─── ILIKE filters ────────────────────────────────────────────────────────────
  
  paramIndexRef.value = addIlikeFilter(conditions, params, paramIndexRef.value, normalizedFilters.firstname,    'u.firstname');
  paramIndexRef.value = addIlikeFilter(conditions, params, paramIndexRef.value, normalizedFilters.lastname,     'u.lastname');
  paramIndexRef.value = addIlikeFilter(conditions, params, paramIndexRef.value, normalizedFilters.email,        'u.email');
  paramIndexRef.value = addIlikeFilter(conditions, params, paramIndexRef.value, normalizedFilters.phoneNumber,  'u.phone_number');
  paramIndexRef.value = addIlikeFilter(conditions, params, paramIndexRef.value, normalizedFilters.jobTitle,     'u.job_title');
  
  // ─── Keyword (must remain last) ───────────────────────────────────────────────
  
  if (normalizedFilters.keyword) {
    const keywordConditions = [
      `u.firstname ILIKE $${paramIndexRef.value}`,
      `u.lastname  ILIKE $${paramIndexRef.value}`,
      `u.email     ILIKE $${paramIndexRef.value}`,
      `u.job_title ILIKE $${paramIndexRef.value}`,
    ];
    
    // Role and status name search are privileged — only included when the
    // service/ACL layer confirms the caller has permission to search these fields.
    if (canSearchRole)   keywordConditions.push(`r.name ILIKE $${paramIndexRef.value}`);
    if (canSearchStatus) keywordConditions.push(`s.name ILIKE $${paramIndexRef.value}`);
    
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
  buildUserFilter,
};

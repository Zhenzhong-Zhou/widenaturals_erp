/**
 * @fileoverview build-user-filter.js
 *
 * Helper for constructing SQL WHERE clauses and parameter arrays used in
 * repository-layer user list and directory queries.
 *
 * Applies default visibility rules to exclude system users and root-level
 * accounts, and supports optional filtering on user and audit fields.
 */

const { normalizeDateRangeFilters, applyDateRangeConditions } = require('./date-range-utils');
const { addIlikeFilter } = require('./sql-helpers');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Build SQL WHERE clause and parameter list for User list / lookup queries.
 *
 * This helper is used by repository-layer queries and is responsible for
 * constructing **row-level filtering conditions only**. It does not perform
 * permission checks itself; all visibility and capability decisions must be
 * resolved by the service / ACL layer and passed in explicitly.
 *
 * @param {Object} [filters={}]
 *   Row-level filter values applied to the users table
 *
 * ### Visibility rules (service-controlled, SQL-enforced)
 * - System users (`u.is_system = TRUE`) are excluded by default
 * - Root-level users (roles with `root_access`) are excluded by default
 * - Both exclusions may be overridden by explicit filter flags
 *
 * ### Visibility Flags
 * @param {boolean} [filters.includeSystemUsers=false]
 *   - When TRUE, system users are included in results
 *
 * @param {boolean} [filters.includeRootUsers=false]
 *   - When TRUE, users with `root_access` permission are included
 *
 * @param {string} [filters.activeStatusId]
 *   - UUID of the ACTIVE status
 *   - Required when `enforceActiveOnly = true`
 *   - Must be resolved by the service layer
 *
 * ### Status Visibility Rule
 * @param {boolean} [filters.enforceActiveOnly=false]
 *   - When TRUE and no statusIds are provided, results are limited to ACTIVE users
 *   - Intended for regular users without elevated permissions
 *
 * ### User-level Filters (`u`)
 * @param {string[]} [filters.statusIds]
 *   - Filter by user status UUID(s)
 *
 * @param {string[]} [filters.roleIds]
 *   - Filter by role UUID(s)
 *
 * @param {string} [filters.firstname]
 *   - ILIKE match on first name
 *
 * @param {string} [filters.lastname]
 *   - ILIKE match on last name
 *
 * @param {string} [filters.email]
 *   - ILIKE match on email
 *
 * @param {string} [filters.phoneNumber]
 *   - ILIKE match on phone number
 *
 * @param {string} [filters.jobTitle]
 *   - ILIKE match on job title
 *
 * ### Audit Filters
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
 * ### Keyword fuzzy search
 * @param {string} [filters.keyword]
 *   Performs ILIKE-based fuzzy search across permitted fields
 *
 * ### Query capability options (resolved by ACL / business logic)
 * @param {Object} [options]
 *
 * @param {boolean} [options.canSearchRole=false]
 *   When TRUE, keyword search may include role name (`roles.name`)
 *   Requires the calling query to JOIN the roles table
 *
 * @param {boolean} [options.canSearchStatus=false]
 *   When TRUE, keyword search may include status name (`statuses.name`)
 *   Requires the calling query to JOIN the statuses table
 *
 * ### Return
 * {
 *   whereClause: '1=1 AND u.is_system = FALSE AND NOT EXISTS(...) AND ...',
 *   params: [...]
 * }
 *
 * @returns {{ whereClause: string, params: any[] }}
 */
const buildUserFilter = (filters = {}, options = {}) => {
  try {
    // -------------------------------------------------------------
    // Normalize UI date filters
    // -------------------------------------------------------------
    filters = normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore');
    filters = normalizeDateRangeFilters(filters, 'updatedAfter', 'updatedBefore');
    
    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };
    
    const includeSystemUsers = filters.includeSystemUsers === true;
    const includeRootUsers = filters.includeRootUsers === true;
    const enforceActiveOnly = filters.enforceActiveOnly === true;
    const hasStatusFilter =
      Array.isArray(filters.statusIds) && filters.statusIds.length > 0;
    
    const {
      canSearchRole = false,
      canSearchStatus = false,
    } = options;
    
    // ------------------------------------
    // Visibility rules (service-controlled)
    // ------------------------------------

    // Hide system users unless explicitly included
    if (!includeSystemUsers) {
      conditions.push('u.is_system = FALSE');
    }

    // Hide root users unless explicitly included
    if (!includeRootUsers) {
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
    
    // ------------------------------------
    // Status visibility rules
    // ------------------------------------

    // ACTIVE-only visibility (applied when enforceActiveOnly is true)
    if (enforceActiveOnly && !hasStatusFilter && filters.activeStatusId) {
      conditions.push(`u.status_id = $${paramIndexRef.value}`);
      params.push(filters.activeStatusId);
      paramIndexRef.value++;
    }
    
    // ------------------------------
    // User-level filters
    // ------------------------------
    if (filters.statusIds?.length) {
      conditions.push(`u.status_id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.statusIds);
      paramIndexRef.value++;
    }
    
    if (filters.roleIds?.length) {
      conditions.push(`u.role_id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.roleIds);
      paramIndexRef.value++;
    }
    
    if (filters.createdBy) {
      conditions.push(`u.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }
    
    if (filters.updatedBy) {
      conditions.push(`u.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }
    
    // ------------------------------
    // Created / Updated date filters
    // ------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'u.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });
    
    applyDateRangeConditions({
      conditions,
      params,
      column: 'u.updated_at',
      after: filters.updatedAfter,
      before: filters.updatedBefore,
      paramIndexRef,
    });
    
    // ------------------------------
    // Text filters (ILIKE helpers)
    // ------------------------------
    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.firstname,
      'u.firstname'
    );
    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.lastname,
      'u.lastname'
    );
    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.email,
      'u.email'
    );
    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.phoneNumber,
      'u.phone_number'
    );
    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.jobTitle,
      'u.job_title'
    );
    
    // ------------------------------
    // Keyword fuzzy search (permission-aware)
    // ------------------------------
    if (filters.keyword) {
      const keywordConditions = [
        `u.firstname ILIKE $${paramIndexRef.value}`,
        `u.lastname  ILIKE $${paramIndexRef.value}`,
        `u.email     ILIKE $${paramIndexRef.value}`,
        `u.job_title ILIKE $${paramIndexRef.value}`,
      ];
      
      // Role name search (privileged)
      if (canSearchRole) {
        keywordConditions.push(`r.name ILIKE $${paramIndexRef.value}`);
      }
      
      // Status name search (privileged)
      if (canSearchStatus) {
        keywordConditions.push(`s.name ILIKE $${paramIndexRef.value}`);
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
    logSystemException(err, 'Failed to build user filter', {
      context: 'user-repository/buildUserFilter',
      filters,
    });
    
    throw AppError.databaseError('Failed to prepare user filter', {
      details: err.message,
    });
  }
};

module.exports = {
  buildUserFilter,
};

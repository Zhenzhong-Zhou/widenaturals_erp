/**
 * @fileoverview build-user-filter.js
 *
 * Helper for constructing SQL WHERE clauses and parameter arrays used in
 * repository-layer user list and directory queries.
 *
 * Applies default visibility rules to exclude system users and root-level
 * accounts, and supports optional filtering on user and audit fields.
 */

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
    const conditions = ['1=1'];
    const params = [];
    let idx = 1;

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
    // Visibility rules (service-controlled, SQL-enforced)
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
      conditions.push(`u.status_id = $${idx}`);
      params.push(filters.activeStatusId);
      idx++;
    }

    // ------------------------------
    // User-level filters
    // ------------------------------
    if (filters.statusIds?.length) {
      conditions.push(`u.status_id = ANY($${idx}::uuid[])`);
      params.push(filters.statusIds);
      idx++;
    }

    if (filters.roleIds?.length) {
      conditions.push(`u.role_id = ANY($${idx}::uuid[])`);
      params.push(filters.roleIds);
      idx++;
    }

    if (filters.email) {
      conditions.push(`u.email ILIKE $${idx}`);
      params.push(`%${filters.email}%`);
      idx++;
    }

    if (filters.firstname) {
      conditions.push(`u.firstname ILIKE $${idx}`);
      params.push(`%${filters.firstname}%`);
      idx++;
    }

    if (filters.lastname) {
      conditions.push(`u.lastname ILIKE $${idx}`);
      params.push(`%${filters.lastname}%`);
      idx++;
    }

    if (filters.phoneNumber) {
      conditions.push(`u.phone_number ILIKE $${idx}`);
      params.push(`%${filters.phoneNumber}%`);
      idx++;
    }

    if (filters.jobTitle) {
      conditions.push(`u.job_title ILIKE $${idx}`);
      params.push(`%${filters.jobTitle}%`);
      idx++;
    }

    // ------------------------------
    // Audit filters
    // ------------------------------
    if (filters.createdBy) {
      conditions.push(`u.created_by = $${idx}`);
      params.push(filters.createdBy);
      idx++;
    }

    if (filters.updatedBy) {
      conditions.push(`u.updated_by = $${idx}`);
      params.push(filters.updatedBy);
      idx++;
    }

    if (filters.createdAfter) {
      conditions.push(`u.created_at >= $${idx}`);
      params.push(filters.createdAfter);
      idx++;
    }

    if (filters.createdBefore) {
      conditions.push(`u.created_at <= $${idx}`);
      params.push(filters.createdBefore);
      idx++;
    }

    if (filters.updatedAfter) {
      conditions.push(`u.updated_at >= $${idx}`);
      params.push(filters.updatedAfter);
      idx++;
    }

    if (filters.updatedBefore) {
      conditions.push(`u.updated_at <= $${idx}`);
      params.push(filters.updatedBefore);
      idx++;
    }

    // ------------------------------
    // Text filters (ILIKE)
    // ------------------------------
    idx = addIlikeFilter(
      conditions,
      params,
      idx,
      filters.firstname,
      'u.firstname'
    );
    idx = addIlikeFilter(
      conditions,
      params,
      idx,
      filters.lastname,
      'u.lastname'
    );
    idx = addIlikeFilter(conditions, params, idx, filters.email, 'u.email');
    idx = addIlikeFilter(
      conditions,
      params,
      idx,
      filters.phoneNumber,
      'u.phone_number'
    );
    idx = addIlikeFilter(
      conditions,
      params,
      idx,
      filters.jobTitle,
      'u.job_title'
    );
    
    // ------------------------------
    // Keyword fuzzy search (permission-aware)
    // ------------------------------
    if (filters.keyword) {
      const keywordConditions = [
        `u.firstname ILIKE $${idx}`,
        `u.lastname  ILIKE $${idx}`,
        `u.email     ILIKE $${idx}`,
        `u.job_title ILIKE $${idx}`,
      ];
      
      // Role name search (privileged)
      if (canSearchRole) {
        keywordConditions.push(`r.name ILIKE $${idx}`);
      }
      
      // Status name search (privileged)
      if (canSearchStatus) {
        keywordConditions.push(`s.name ILIKE $${idx}`);
      }
      
      conditions.push(`(${keywordConditions.join(' OR ')})`);
      params.push(`%${filters.keyword}%`);
      idx++;
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

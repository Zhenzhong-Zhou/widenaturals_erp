/**
 * @fileoverview
 * Role SQL filter builder.
 *
 * Centralizes logic for dynamically generating parameterized SQL `WHERE`
 * clauses for querying the `roles` table (optionally joined with `status`).
 *
 * Ensures:
 * - Secure, reusable query generation for role lookup and admin screens
 * - SQL-injection safety via positional parameters
 * - Consistent filtering semantics across repositories
 *
 * NOTE:
 * Role-relative and permission-scoped filtering is NOT finalized yet.
 * Explicit TODO markers indicate where future logic will be enforced.
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a parameterized SQL WHERE clause for querying Roles.
 *
 * ## Status Filter Priority
 * 1. `statusIds` (array of UUIDs)
 * 2. `status_id` (single UUID)
 * 3. `_activeStatusId` (permission-enforced fallback)
 *
 * ## Supported Filters
 * | Field                | Type         | Description                                              |
 * |----------------------|--------------|----------------------------------------------------------|
 * | `statusIds`          | string[]     | Filter by multiple role status IDs                       |
 * | `status_id`          | string       | Filter by a single status ID                             |
 * | `_activeStatusId`    | string       | Forced fallback when caller lacks permission             |
 * | `role_group`         | string       | Exact role group match                                   |
 * | `is_active`          | boolean      | Active flag                                              |
 * | `parent_role_id`     | string       | Parent role reference                                    |
 * | `hierarchy_level`    | number       | Exact hierarchy level                                    |
 * | `keyword`            | string       | Fuzzy search (name / description / role_group)           |
 *
 * ## TODO (Future Enhancements)
 * - Enforce role-visibility based on caller permissions
 * - Restrict hierarchy traversal (e.g. cannot view above own level)
 * - Support relative role queries (siblings / descendants)
 *
 * @param {Object} [filters={}] - Structured role filter criteria
 * @returns {{ whereClause: string, params: any[] }}
 */
const buildRoleFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let idx = 1;
    
    /**
     * Status filtering (priority-based)
     *
     * TODO:
     * `_activeStatusId` should be injected by the service layer
     * when caller lacks permission to view inactive roles.
     */
    const statusFilterValue = filters.statusIds?.length
      ? filters.statusIds
      : filters.status_id
        ? filters.status_id
        : filters._activeStatusId;
    
    if (statusFilterValue !== undefined && statusFilterValue !== null) {
      if (Array.isArray(statusFilterValue)) {
        conditions.push(`r.status_id = ANY($${idx}::uuid[])`);
      } else {
        conditions.push(`r.status_id = $${idx}`);
      }
      
      params.push(statusFilterValue);
      idx++;
    }
    
    // Exact role group match
    if (filters.role_group) {
      conditions.push(`r.role_group = $${idx}`);
      params.push(filters.role_group);
      idx++;
    }

    // Operational flag (service-gated; NOT lifecycle visibility)
    if (filters.is_active !== undefined) {
      conditions.push(`r.is_active = $${idx}`);
      params.push(filters.is_active);
      idx++;
    }
    
    // Parent role
    if (filters.parent_role_id) {
      conditions.push(`r.parent_role_id = $${idx}`);
      params.push(filters.parent_role_id);
      idx++;
    }
    
    // Hierarchy level
    if (filters.hierarchy_level !== undefined) {
      conditions.push(`r.hierarchy_level = $${idx}`);
      params.push(filters.hierarchy_level);
      idx++;
    }
    
    /**
     * Keyword search (fuzzy)
     *
     * NOTE:
     * Uses a single placeholder shared across all searchable fields.
     * This matches keyword semantics and avoids param duplication.
     */
    if (filters.keyword) {
      const keywordConditions = [
        `r.name ILIKE $${idx}`,
        `r.description ILIKE $${idx}`,
        `r.role_group ILIKE $${idx}`,
      ];
      
      conditions.push(`(${keywordConditions.join(' OR ')})`);
      params.push(`%${filters.keyword}%`);
      idx++;
    }
    
    /**
     * TODO (Role-relative logic)
     * - Enforce hierarchy visibility
     * - Descendant-only access
     * - Recursive CTE support
     */
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build role filter', {
      context: 'role-repository/buildRoleFilter',
      error: err.message,
      filters,
    });
    
    throw AppError.databaseError('Failed to prepare role filter', {
      details: err.message,
      stage: 'build-role-where-clause',
    });
  }
};

module.exports = {
  buildRoleFilter,
};

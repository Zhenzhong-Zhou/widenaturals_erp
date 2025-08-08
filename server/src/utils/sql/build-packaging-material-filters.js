/**
 * @fileoverview
 * Utility to build a dynamic SQL WHERE clause and parameter array
 * for filtering packaging materials, especially for sales order lookup.
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds WHERE clause and parameters for packaging material lookup.
 *
 * Supports:
 * - Keyword search on name, color, size, material_composition
 * - Filtering by:
 *   - Active status (via `statusId` or `_activeStatusId`)
 *   - is_visible_for_sales_order (enabled by `visibleOnly`)
 *   - Archived flag (controlled by `restrictToUnarchived`)
 *   - Created/updated by
 *
 * This function is used in sales UIs (restricted mode) or admin tables (full access mode),
 * depending on how the flags are set.
 *
 * @param {Object} [filters={}] - Filters to apply
 * @param {string} [filters.keyword] - Case-insensitive keyword search
 * @param {string} [filters.statusId] - Filter by status ID
 * @param {string} [filters.createdBy] - Filter by creator user ID
 * @param {string} [filters.updatedBy] - Filter by updater user ID
 * @param {boolean} [filters.visibleOnly] - If true, include only records marked visible for sales order dropdown (default: false).
 * @param {boolean} [filters.restrictToUnarchived=true] - If true, exclude archived materials (is_archived = false)
 * @param {boolean} [filters.restrictToActiveStatus=true] - If true, apply active status filtering using statusId or _activeStatusId
 * @param {string} [filters._activeStatusId] - Optional fallback value used when no explicit statusId is passed
 *
 * @returns {{ whereClause: string, params: any[] }} - SQL WHERE clause and parameter list
 *
 * @throws {AppError} If an error occurs during filter construction
 */
const buildPackagingMaterialsFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;
    
    // Visibility for sales
    if (filters.visibleOnly === true) {
      conditions.push(`pm.is_visible_for_sales_order = true`);
    }
    
    // Only unarchived by default
    if (filters.restrictToUnarchived !== false) {
      conditions.push(`pm.is_archived = false`);
    }
    
    // Status
    if (filters.statusId) {
      conditions.push(`pm.status_id = $${paramIndex}`);
      params.push(filters.statusId);
      paramIndex++;
    } else if (filters._activeStatusId) {
      conditions.push(`pm.status_id = $${paramIndex}`);
      params.push(filters._activeStatusId);
      paramIndex++;
    }
    
    // Keyword search
    if (filters.keyword) {
      const keywordParam = `%${filters.keyword}%`;
      conditions.push(`(
        pm.name ILIKE $${paramIndex} OR
        pm.color ILIKE $${paramIndex} OR
        pm.size ILIKE $${paramIndex} OR
        pm.grade ILIKE $${paramIndex} OR
        pm.material_composition ILIKE $${paramIndex}
      )`);
      params.push(keywordParam);
      paramIndex++;
    }
    
    // Created/updated by
    if (filters.createdBy) {
      conditions.push(`pm.created_by = $${paramIndex}`);
      params.push(filters.createdBy);
      paramIndex++;
    }
    
    if (filters.updatedBy) {
      conditions.push(`pm.updated_by = $${paramIndex}`);
      params.push(filters.updatedBy);
      paramIndex++;
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build packaging material filter', {
      context: 'packaging-materials-repository/buildPackagingMaterialsFilter',
      filters,
      error: err.message,
    });
    throw AppError.databaseError('Failed to prepare packaging material filter', {
      details: err.message,
      stage: 'build-packaging-materials-where-clause',
    });
  }
};

module.exports = {
  buildPackagingMaterialsFilter,
};

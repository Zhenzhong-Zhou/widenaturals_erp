/**
 * @fileoverview build-batch-status-filter.js
 *
 * Helper for constructing SQL WHERE clauses and parameter arrays
 * for repository-layer batch status lookup queries.
 *
 * Applies optional filtering on lifecycle status fields and
 * audit metadata.
 */

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { addIlikeFilter } = require('./sql-helpers');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Build SQL WHERE clause and parameter list for batch status queries.
 *
 * @param {Object} [filters={}]
 *
 * ### Status Filters
 * @param {boolean} [filters.isActive]
 *   Filter active/inactive statuses
 *
 * @param {string[]} [filters.ids]
 *   Filter by status UUIDs
 *
 * ### Text Filters
 * @param {string} [filters.name]
 *   ILIKE match on status name
 *
 * @param {string} [filters.description]
 *   ILIKE match on status description
 *
 * ### Audit Filters
 * @param {string} [filters.createdBy]
 * @param {string} [filters.updatedBy]
 *
 * @param {string} [filters.createdAfter]
 * @param {string} [filters.createdBefore]
 *
 * @param {string} [filters.updatedAfter]
 * @param {string} [filters.updatedBefore]
 *
 * ### Keyword fuzzy search
 * @param {string} [filters.keyword]
 *   ILIKE search across name + description
 *
 * @returns {{ whereClause: string, params: any[] }}
 */
const buildBatchStatusFilter = (filters = {}) => {
  try {
    //------------------------------------------------------------
    // Normalize date filters
    //------------------------------------------------------------
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
    
    //------------------------------------------------------------
    // Status filters
    //------------------------------------------------------------
    
    if (filters.ids?.length) {
      conditions.push(`bs.id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.ids);
      paramIndexRef.value++;
    }
    
    if (filters.isActive !== undefined) {
      conditions.push(`bs.is_active = $${paramIndexRef.value}`);
      params.push(filters.isActive);
      paramIndexRef.value++;
    }
    
    //------------------------------------------------------------
    // Audit filters
    //------------------------------------------------------------
    
    if (filters.createdBy) {
      conditions.push(`bs.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }
    
    if (filters.updatedBy) {
      conditions.push(`bs.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }
    
    //------------------------------------------------------------
    // Date range filters
    //------------------------------------------------------------
    
    applyDateRangeConditions({
      conditions,
      params,
      column: 'bs.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });
    
    applyDateRangeConditions({
      conditions,
      params,
      column: 'bs.updated_at',
      after: filters.updatedAfter,
      before: filters.updatedBefore,
      paramIndexRef,
    });
    
    //------------------------------------------------------------
    // Text filters
    //------------------------------------------------------------
    
    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.name,
      'bs.name'
    );
    
    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.description,
      'bs.description'
    );
    
    //------------------------------------------------------------
    // Keyword fuzzy search
    //------------------------------------------------------------
    
    if (filters.keyword) {
      const keywordConditions = [
        `bs.name ILIKE $${paramIndexRef.value}`,
        `bs.description ILIKE $${paramIndexRef.value}`,
      ];
      
      conditions.push(`(${keywordConditions.join(' OR ')})`);
      params.push(`%${filters.keyword}%`);
      paramIndexRef.value++;
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build batch status filter', {
      context: 'batch-status-repository/buildBatchStatusFilter',
      filters,
    });
    
    throw AppError.databaseError('Failed to prepare batch status filter', {
      details: err.message,
    });
  }
};

module.exports = {
  buildBatchStatusFilter,
};

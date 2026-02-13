/**
 * @fileoverview
 * Utility to dynamically build an SQL `WHERE` clause and parameter list
 * for filtering and paginating the `order_types` table.
 *
 * Supports filtering by category (including multiple values), status, payment requirement,
 * user references, date ranges, and keyword search (with optional restrictions).
 * Also supports internal access control flags such as `_activeStatusId` and `_restrictKeywordToValidOnly`.
 */

const { normalizeDateRangeFilters, applyDateRangeConditions } = require('./date-range-utils');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds an SQL `WHERE` clause and parameter array for filtering `order_types`.
 *
 * This utility supports both user-facing filters and internal system-injected flags
 * to enforce access control (e.g., restricting to "active" status or keyword scope).
 *
 * @param {Object} [filters={}] - Optional filtering criteria.
 * @param {string} [filters.name] - Partial match on `name` (ILIKE).
 * @param {string} [filters.code] - Partial match on `code` (ILIKE).
 * @param {string|string[]} [filters.category] - Order category or list of categories (e.g., `'sales'` or `['sales', 'purchase']`).
 * @param {string} [filters.statusId] - Status ID (overridden by `_activeStatusId` if present).
 * @param {boolean} [filters.requiresPayment] - Whether the order type requires payment.
 * @param {string} [filters.createdBy] - Filter by creator user ID.
 * @param {string} [filters.updatedBy] - Filter by last updater user ID.
 * @param {string} [filters.createdAfter] - Records created on or after this ISO date.
 * @param {string} [filters.createdBefore] - Records created on or before this ISO date.
 * @param {string} [filters.updatedAfter] - Records updated on or after this ISO date.
 * @param {string} [filters.updatedBefore] - Records updated on or before this ISO date.
 * @param {string} [filters.keyword] - Fuzzy search applied to `name` and `code` by default.
 * @param {string} [filters._activeStatusId] - Internal override to enforce "active-only" status filtering.
 * @param {boolean} [filters._restrictKeywordToValidOnly] - If true, restricts keyword search to `name` only (excludes `code`).
 *
 * @returns {{ whereClause: string, params: any[] }} SQL `WHERE` clause string and ordered parameters array.
 *
 * @example
 * const { whereClause, params } = buildOrderTypeFilter({
 *   category: ['sales', 'purchase'],
 *   requiresPayment: true,
 *   keyword: 'return',
 *   _restrictKeywordToValidOnly: true,
 *   _activeStatusId: 'status-active-uuid',
 * });
 * // whereClause: "1=1 AND ot.category IN ($1, $2) AND ot.requires_payment = $3 AND ot.status_id = $4 AND ot.name ILIKE $5"
 * // params: ['sales', 'purchase', true, 'status-active-uuid', '%return%']
 *
 * @throws {AppError} If an error occurs while building the filter.
 */
const buildOrderTypeFilter = (filters = {}) => {
  try {
    // -------------------------------------------------------------
    // Normalize date-only filters FIRST
    // -------------------------------------------------------------
    filters = normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore');
    filters = normalizeDateRangeFilters(filters, 'updatedAfter', 'updatedBefore');
    
    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };
    
    if (filters.name) {
      conditions.push(`ot.name ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.name}%`);
      paramIndexRef.value++;
    }
    
    if (filters.code) {
      conditions.push(`ot.code ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.code}%`);
      paramIndexRef.value++;
    }
    
    // ------------------------------
    // Category (single or multiple)
    // ------------------------------
    if (filters.category) {
      if (Array.isArray(filters.category)) {
        const placeholders = filters.category.map(
          () => `$${paramIndexRef.value++}`
        );
        conditions.push(`ot.category IN (${placeholders.join(', ')})`);
        params.push(...filters.category);
      } else {
        conditions.push(`ot.category = $${paramIndexRef.value}`);
        params.push(filters.category);
        paramIndexRef.value++;
      }
    }
    
    // ------------------------------
    // Status enforcement
    // ------------------------------
    if (filters._activeStatusId) {
      conditions.push(`ot.status_id = $${paramIndexRef.value}`);
      params.push(filters._activeStatusId);
      paramIndexRef.value++;
    } else if (filters.statusId) {
      conditions.push(`ot.status_id = $${paramIndexRef.value}`);
      params.push(filters.statusId);
      paramIndexRef.value++;
    }
    
    if (filters.requiresPayment !== undefined) {
      conditions.push(`ot.requires_payment = $${paramIndexRef.value}`);
      params.push(filters.requiresPayment);
      paramIndexRef.value++;
    }
    
    if (filters.createdBy) {
      conditions.push(`ot.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }
    
    if (filters.updatedBy) {
      conditions.push(`ot.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }
    
    // ------------------------------
    // Created / Updated date filters
    // ------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'ot.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });
    
    applyDateRangeConditions({
      conditions,
      params,
      column: 'ot.updated_at',
      after: filters.updatedAfter,
      before: filters.updatedBefore,
      paramIndexRef,
    });
    
    // ------------------------------
    // Keyword search
    // ------------------------------
    if (filters.keyword) {
      const keywordClause = filters._restrictKeywordToValidOnly
        ? `ot.name ILIKE $${paramIndexRef.value}`
        : `(ot.name ILIKE $${paramIndexRef.value} OR ot.code ILIKE $${paramIndexRef.value})`;
      
      conditions.push(keywordClause);
      params.push(`%${filters.keyword.trim().replace(/\s+/g, ' ')}%`);
      paramIndexRef.value++;
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build order type filter', {
      context: 'order-type-repository/buildOrderTypeFilter',
      error: err.message,
      filters,
    });
    
    throw AppError.databaseError('Failed to prepare order type filter', {
      details: err.message,
      stage: 'build-order-type-where-clause',
    });
  }
};

module.exports = {
  buildOrderTypeFilter,
};

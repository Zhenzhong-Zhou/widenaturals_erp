/**
 * @fileoverview
 * Location SQL filter builder.
 *
 * Centralized logic for generating parameterized SQL WHERE clauses
 * for querying the `locations` table.
 *
 * Design goals:
 * - Secure (fully parameterized)
 * - Reusable across repositories
 * - Extensible for dashboards & reports
 * - Soft-archive aware
 * - Date range compatible
 */

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a parameterized SQL WHERE clause for Locations.
 *
 * Supports:
 * - status filtering
 * - archive filtering
 * - location type filtering
 * - city / province / country
 * - creator filtering
 * - created date range
 * - keyword search (name + address fields)
 *
 * @param {Object} [filters={}]
 *
 * @param {string[]} [filters.statusIds]
 * @param {string} [filters.status_id]
 * @param {string} [filters._activeStatusId]
 *
 * @param {boolean} [filters.includeArchived]
 * @param {string} [filters.locationTypeId]
 * @param {string} [filters.city]
 * @param {string} [filters.province_or_state]
 * @param {string} [filters.country]
 * @param {string} [filters.createdBy]
 *
 * @param {string} [filters.createdAfter]
 * @param {string} [filters.createdBefore]
 *
 * @param {string} [filters.keyword]
 *
 * @returns {{ whereClause: string, params: any[] }}
 */
const buildLocationFilter = (filters = {}) => {
  try {
    filters = normalizeDateRangeFilters(
      filters,
      'createdAfter',
      'createdBefore'
    );
    
    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };
    
    // -------------------------------------------------------------
    // Archive handling (default: exclude archived)
    // -------------------------------------------------------------
    if (!filters.includeArchived) {
      conditions.push(`l.is_archived = false`);
    }
    
    // -------------------------------------------------------------
    // Status resolution (same priority model as products)
    // -------------------------------------------------------------
    const statusFilterValue = filters.statusIds?.length
      ? filters.statusIds
      : filters.status_id
        ? filters.status_id
        : filters._activeStatusId;
    
    if (statusFilterValue !== undefined && statusFilterValue !== null) {
      if (Array.isArray(statusFilterValue)) {
        conditions.push(
          `l.status_id = ANY($${paramIndexRef.value}::uuid[])`
        );
      } else {
        conditions.push(`l.status_id = $${paramIndexRef.value}`);
      }
      
      params.push(statusFilterValue);
      paramIndexRef.value++;
    }
    
    // -------------------------------------------------------------
    // Location type
    // -------------------------------------------------------------
    if (filters.locationTypeId) {
      conditions.push(`l.location_type_id = $${paramIndexRef.value}`);
      params.push(filters.locationTypeId);
      paramIndexRef.value++;
    }
    
    // -------------------------------------------------------------
    // City / Province / Country
    // -------------------------------------------------------------
    if (filters.city) {
      conditions.push(`l.city ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.city}%`);
      paramIndexRef.value++;
    }
    
    if (filters.province_or_state) {
      conditions.push(`l.province_or_state ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.province_or_state}%`);
      paramIndexRef.value++;
    }
    
    if (filters.country) {
      conditions.push(`l.country ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.country}%`);
      paramIndexRef.value++;
    }
    
    // -------------------------------------------------------------
    // Created by
    // -------------------------------------------------------------
    if (filters.createdBy) {
      conditions.push(`l.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }
    
    // -------------------------------------------------------------
    // Created date range
    // -------------------------------------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'l.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });
    
    // -------------------------------------------------------------
    // Keyword search
    // -------------------------------------------------------------
    if (filters.keyword) {
      const likeParam = `%${filters.keyword}%`;
      
      const searchFields = [
        'l.name',
        'l.address_line1',
        'l.address_line2',
        'l.city',
        'l.province_or_state',
        'l.postal_code',
        'l.country',
      ];
      
      const orConditions = searchFields
        .map((field) => `${field} ILIKE $${paramIndexRef.value}`)
        .join(' OR ');
      
      conditions.push(`(${orConditions})`);
      params.push(likeParam);
      paramIndexRef.value++;
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build location filter', {
      context: 'location-repository/buildLocationFilter',
      error: err.message,
      filters,
    });
    
    throw AppError.databaseError('Failed to prepare location filter', {
      details: err.message,
      stage: 'build-location-where-clause',
    });
  }
};

module.exports = {
  buildLocationFilter,
};

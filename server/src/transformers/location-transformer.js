const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { cleanObject } = require('../utils/object-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');

/**
 * Transforms a single raw location SQL row into a clean, API-ready object.
 *
 * @param {Record<string, any>} row - Raw SQL row from `getPaginatedLocations`
 * @returns {Record<string, any>} Normalized location object
 */
const transformLocationRow = (row) => {
  const base = {
    id: row.id,
    name: row.name,
    
    locationType: row.location_type_name ?? null,
    
    address: {
      city: row.city ?? null,
      provinceOrState: row.province_or_state ?? null,
      country: row.country ?? null,
    },
    
    isArchived: row.is_archived ?? false,
    
    status: {
      id: row.status_id ?? null,
      name: row.status_name ?? null,
      date: row.status_date ?? null,
    },
    
    audit: compactAudit(makeAudit(row)),
  };
  
  return cleanObject(base);
};

/**
 * Transforms a paginated result of location rows into API-ready format.
 *
 * Wraps `transformLocationRow` for each item and preserves pagination metadata.
 *
 * ─────────────────────────────────────────────────────────────
 * Input
 * ─────────────────────────────────────────────────────────────
 * {
 *   data: [SQLRow, SQLRow, ...],
 *   pagination: { page, limit, totalRecords, totalPages }
 * }
 *
 * ─────────────────────────────────────────────────────────────
 * Output
 * ─────────────────────────────────────────────────────────────
 * {
 *   data: [TransformedLocation, ...],
 *   pagination: { page, limit, totalRecords, totalPages }
 * }
 *
 * @param {{
 *   data: Record<string, any>[];
 *   pagination: { page: number; limit: number; totalRecords: number; totalPages: number };
 * }} paginatedResult - Raw paginated query result
 *
 * @returns {{
 *   data: Record<string, any>[];
 *   pagination: { page: number; limit: number; totalRecords: number; totalPages: number };
 * }} Cleaned paginated location results
 */
const transformPaginatedLocationResults = (paginatedResult) => {
  return transformPaginatedResult(paginatedResult, (row) =>
    transformLocationRow(row)
  );
};

module.exports = {
  transformLocationRow,
  transformPaginatedLocationResults,
};

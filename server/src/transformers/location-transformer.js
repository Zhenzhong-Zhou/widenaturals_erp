const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { cleanObject } = require('../utils/object-utils');
const { transformPageResult } = require('../utils/transformer-utils');

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
 * Transform a paginated location query result into API-ready format.
 *
 * Applies `transformLocationRow` to each row while preserving
 * pagination metadata.
 *
 * @param {{
 *   data: Record<string, any>[],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }} paginatedResult
 *
 * @returns {Promise<PaginatedResult<T>>}
 */
const transformPaginatedLocationResults = (paginatedResult) =>
  transformPageResult(paginatedResult, transformLocationRow);

module.exports = {
  transformLocationRow,
  transformPaginatedLocationResults,
};

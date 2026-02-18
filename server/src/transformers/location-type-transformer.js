const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { cleanObject } = require('../utils/object-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');

/**
 * Transforms a single raw location type SQL row
 * into a normalized, API-ready object.
 *
 * @param {Record<string, any>} row
 * @returns {Record<string, any>}
 */
const transformLocationTypeRow = (row) => {
  const base = {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? null,

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
 * Transforms paginated location type results
 * into API-ready format.
 *
 * Preserves pagination metadata while mapping
 * each SQL row through `transformLocationTypeRow`.
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
 *   data: [TransformedLocationType, ...],
 *   pagination: { page, limit, totalRecords, totalPages }
 * }
 *
 * @param {{
 *   data: Record<string, any>[];
 *   pagination: {
 *     page: number;
 *     limit: number;
 *     totalRecords: number;
 *     totalPages: number;
 *   };
 * }} paginatedResult
 *
 * @returns {{
 *   data: Record<string, any>[];
 *   pagination: {
 *     page: number;
 *     limit: number;
 *     totalRecords: number;
 *     totalPages: number;
 *   };
 * }}
 */
const transformPaginatedLocationTypeResults = (paginatedResult) => {
  return transformPaginatedResult(paginatedResult, (row) =>
    transformLocationTypeRow(row)
  );
};

/**
 * Transformer: Location Type Detail
 *
 * Normalizes a raw SQL row from `getLocationTypeById`
 * into a clean, API-ready object structure used by
 * the service and controller layers.
 *
 * ─────────────────────────────────────────────────────────────
 * Behavior
 * ─────────────────────────────────────────────────────────────
 * - Groups status information into a nested `status` object.
 * - Groups audit information into a normalized `audit` object.
 * - Ensures optional fields default to `null` where applicable.
 * - Prevents leaking raw database column names.
 *
 * @param {Record<string, any>} row
 *   Raw location type row returned from repository.
 *
 * @returns {object}
 *   Normalized location type detail object.
 *
 * @example
 * const locationType = transformLocationTypeDetail(row);
 * console.log(locationType.status.name); // "Active"
 */
const transformLocationTypeDetail = (row) => {
  const base = {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? null,

    status: {
      id: row.status_id ?? null,
      name: row.status_name ?? null,
      date: row.status_date ?? null,
    },

    audit: compactAudit(makeAudit(row)),
  };

  return cleanObject(base);
};

module.exports = {
  transformPaginatedLocationTypeResults,
  transformLocationTypeDetail,
};

/**
 * @file build-location-filter.js
 * @description SQL WHERE clause builder for locations queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Status and archive enforcement is NOT defaulted here. Restricted
 * callers are pinned by the business resolver (statusId pinned to
 * active, includeArchived forced false); this builder applies WHERE
 * clauses only when the relevant inputs are explicitly set.
 *
 * Exports:
 *  - buildLocationFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { applyAuditConditions } = require('./build-audit-filter');

/**
 * Builds a parameterised SQL WHERE clause for locations queries.
 *
 * Column anchor:
 *  l. — locations
 *
 * Status priority:
 *  - statusIds (array) takes precedence over statusId (scalar).
 *
 * Location type priority:
 *  - locationTypeIds (array) takes precedence over locationTypeId (scalar).
 *
 * @param {LocationFilters} [filters={}]
 * @returns {{ whereClause: string, params: Array }}
 */
const buildLocationFilter = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'updatedAfter',
    'updatedBefore'
  );

  const conditions = ['1=1'];
  const params = [];
  const paramIndexRef = { value: 1 };

  const {
    includeArchived,
    statusId,
    statusIds,
    locationTypeId,
    locationTypeIds,
    city,
    provinceOrState,
    country,
    keyword,
  } = normalizedFilters;

  // ─── Archive ───────────────────────────────────────────────────────────────

  if (!includeArchived) {
    conditions.push(`l.is_archived = false`);
  }

  // ─── Status ────────────────────────────────────────────────────────────────

  const statusValue = statusIds?.length ? statusIds : statusId;

  if (statusValue !== null && statusValue !== undefined) {
    conditions.push(
      Array.isArray(statusValue)
        ? `l.status_id = ANY($${paramIndexRef.value++}::uuid[])`
        : `l.status_id = $${paramIndexRef.value++}`
    );
    params.push(statusValue);
  }

  // ─── Location type ─────────────────────────────────────────────────────────

  const locationTypeValue = locationTypeIds?.length
    ? locationTypeIds
    : locationTypeId;

  if (locationTypeValue !== null && locationTypeValue !== undefined) {
    conditions.push(
      Array.isArray(locationTypeValue)
        ? `l.location_type_id = ANY($${paramIndexRef.value++}::uuid[])`
        : `l.location_type_id = $${paramIndexRef.value++}`
    );
    params.push(locationTypeValue);
  }

  // ─── Geography ─────────────────────────────────────────────────────────────

  if (city) {
    conditions.push(`l.city ILIKE $${paramIndexRef.value++}`);
    params.push(`%${city}%`);
  }

  if (provinceOrState) {
    conditions.push(`l.province_or_state ILIKE $${paramIndexRef.value++}`);
    params.push(`%${provinceOrState}%`);
  }

  if (country) {
    conditions.push(`l.country ILIKE $${paramIndexRef.value++}`);
    params.push(`%${country}%`);
  }

  // ─── Audit ─────────────────────────────────────────────────────────────────

  applyDateRangeConditions({
    conditions,
    params,
    column: 'l.created_at',
    after: normalizedFilters.createdAfter,
    before: normalizedFilters.createdBefore,
    paramIndexRef,
  });

  applyDateRangeConditions({
    conditions,
    params,
    column: 'l.updated_at',
    after: normalizedFilters.updatedAfter,
    before: normalizedFilters.updatedBefore,
    paramIndexRef,
  });

  applyAuditConditions(
    conditions,
    params,
    paramIndexRef,
    normalizedFilters,
    'l'
  );

  // ─── Keyword ───────────────────────────────────────────────────────────────

  if (keyword) {
    const idx = paramIndexRef.value++;
    const searchFields = [
      'l.name',
      'l.address_line1',
      'l.address_line2',
      'l.city',
      'l.province_or_state',
      'l.postal_code',
      'l.country',
    ];
    conditions.push(
      `(${searchFields.map((f) => `${f} ILIKE $${idx}`).join(' OR ')})`
    );
    params.push(`%${keyword}%`);
  }

  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildLocationFilter,
};

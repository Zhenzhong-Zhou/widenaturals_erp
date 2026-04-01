/**
 * @file compliance-record-queries.js
 * @description SQL query constants and factory functions for
 * compliance-record-repository.js.
 *
 * Exports:
 *  - COMPLIANCE_RECORD_TABLE        — aliased table name passed to paginateQuery
 *  - COMPLIANCE_RECORD_JOINS        — join array for paginated query
 *  - COMPLIANCE_RECORD_SORT_WHITELIST — valid sort fields for paginated query
 *  - buildComplianceRecordQuery     — factory for paginated list query
 *  - COMPLIANCE_BY_SKU_QUERY        — static fetch by sku_id
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Paginated List ───────────────────────────────────────────────────────────

const COMPLIANCE_RECORD_TABLE = 'compliance_records cr';

const COMPLIANCE_RECORD_JOINS = [
  'JOIN sku_compliance_links scl ON scl.compliance_record_id = cr.id',
  'JOIN skus s                   ON s.id = scl.sku_id',
  'JOIN products p               ON p.id = s.product_id',
  'JOIN status st                ON st.id = cr.status_id',
  'LEFT JOIN users u1            ON u1.id = cr.created_by',
  'LEFT JOIN users u2            ON u2.id = cr.updated_by',
];

const _COMPLIANCE_RECORD_JOINS_SQL = COMPLIANCE_RECORD_JOINS.join('\n  ');

const COMPLIANCE_RECORD_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.complianceRecordSortMap)
);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildComplianceRecordFilter.
 * @returns {string}
 */
const buildComplianceRecordQuery = (whereClause) => `
  SELECT
    cr.id                         AS compliance_record_id,
    cr.type,
    cr.compliance_id              AS document_number,
    cr.issued_date,
    cr.expiry_date,
    cr.status_id,
    st.name                       AS status_name,
    cr.status_date,
    cr.created_at,
    cr.updated_at,
    cr.created_by,
    u1.firstname                  AS created_by_firstname,
    u1.lastname                   AS created_by_lastname,
    cr.updated_by,
    u2.firstname                  AS updated_by_firstname,
    u2.lastname                   AS updated_by_lastname,
    s.id                          AS sku_id,
    s.sku                         AS sku_code,
    s.size_label,
    s.market_region,
    s.country_code,
    p.id                          AS product_id,
    p.name                        AS product_name,
    p.brand,
    p.series,
    p.category
  FROM ${COMPLIANCE_RECORD_TABLE}
  ${_COMPLIANCE_RECORD_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── By SKU ───────────────────────────────────────────────────────────────────

// Fetches all compliance records linked to a SKU via sku_compliance_links.
// Ordered by issued_date then expiry_date — most recent first, nulls last.
// $1: sku_id (UUID)
const COMPLIANCE_BY_SKU_QUERY = `
  SELECT
    cr.id,
    cr.type,
    cr.compliance_id,
    cr.issued_date,
    cr.expiry_date,
    cr.description,
    cr.status_id,
    st.name                       AS status_name,
    cr.status_date,
    cr.created_at,
    cr.updated_at,
    cr.created_by,
    u1.firstname                  AS created_by_firstname,
    u1.lastname                   AS created_by_lastname,
    cr.updated_by,
    u2.firstname                  AS updated_by_firstname,
    u2.lastname                   AS updated_by_lastname
  FROM sku_compliance_links scl
  JOIN compliance_records cr    ON cr.id = scl.compliance_record_id
  LEFT JOIN status st           ON st.id = cr.status_id
  LEFT JOIN users u1            ON u1.id = cr.created_by
  LEFT JOIN users u2            ON u2.id = cr.updated_by
  WHERE scl.sku_id = $1
  ORDER BY
    cr.issued_date DESC NULLS LAST,
    cr.expiry_date DESC NULLS LAST
`;

module.exports = {
  COMPLIANCE_RECORD_TABLE,
  COMPLIANCE_RECORD_JOINS,
  COMPLIANCE_RECORD_SORT_WHITELIST,
  buildComplianceRecordQuery,
  COMPLIANCE_BY_SKU_QUERY,
};

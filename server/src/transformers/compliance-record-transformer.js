/**
 * @file compliance-record-transformer.js
 * @description Row-level and page-level transformers for compliance record data.
 *
 * Exports:
 *   - transformPaginatedComplianceRecordResults – transforms paginated compliance query results
 *   - transformComplianceRecord                 – transforms a permission-filtered SKU detail row
 *
 * Internal helpers (not exported):
 *   - transformComplianceRecordRow – transforms a single paginated compliance row
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { cleanObject }            = require('../utils/object-utils');
const { getProductDisplayName }  = require('../utils/display-name-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { transformPageResult }    = require('../utils/transformer-utils');

/**
 * Transforms a single raw compliance record DB row into the paginated table view shape.
 *
 * @param {ComplianceRecordRow} row
 * @returns {ComplianceRecordResult|null}
 */
const transformComplianceRecordRow = (row) => {
  if (!row) return null;
  
  return cleanObject({
    id:             row.compliance_record_id,
    type:           row.type,
    documentNumber: row.document_number,
    issuedDate:     row.issued_date,
    expiryDate:     row.expiry_date,
    
    status: {
      id:   row.status_id,
      name: row.status_name,
      date: row.status_date,
    },
    
    audit: compactAudit(makeAudit(row)),
    
    sku: {
      id:           row.sku_id,
      sku:          row.sku_code,
      sizeLabel:    row.size_label,
      marketRegion: row.market_region,
    },
    
    product: {
      id:          row.product_id,
      name:        row.product_name,
      brand:       row.brand,
      series:      row.series,
      category:    row.category,
      displayName: getProductDisplayName({
        product_name: row.product_name,
        brand:        row.brand        ?? '',
        sku:          row.sku_code     ?? '',
        country_code: row.country_code ?? '',
      }),
    },
  });
};

/**
 * Transforms a paginated compliance record result set into the table view shape.
 *
 * Delegates per-row transformation to `transformComplianceRecordRow` via
 * `transformPageResult`, which preserves pagination metadata.
 *
 * @param {Object} paginatedResult
 * @param {ComplianceRecordRow[]} paginatedResult.data
 * @param {Object} paginatedResult.pagination
 * @returns {Promise<PaginatedResult<ComplianceRecordRow>>}
 */
const transformPaginatedComplianceRecordResults = (paginatedResult) =>
  transformPageResult(paginatedResult, transformComplianceRecordRow);

/**
 * Transforms a permission-filtered compliance row into the SKU detail compliance shape.
 *
 * Permission filtering is handled upstream by `sliceComplianceRecordsForUser`.
 * This function performs pure, stateless, null-safe field mapping only.
 *
 * @param {SliceSkuDetailCompliance|null} row
 * @returns {SkuDetailCompliance|null}
 */
const transformComplianceRecord = (row) => {
  if (!row) return null;
  
  // Map optional metadata — preserve undefined so cleanObject can prune it.
  const metadata = row.metadata
    ? {
      status: row.metadata.status
        ? {
          id:   row.metadata.status.id,
          name: row.metadata.status.name,
          date: row.metadata.status.date,
        }
        : undefined,
      description: row.metadata.description,
    }
    : undefined;
  
  return {
    id:           row.id,
    type:         row.type,
    complianceId: row.complianceNumber,
    issuedDate:   row.issuedDate,
    expiryDate:   row.expiryDate,
    metadata,
    audit:        row.audit,
  };
};

module.exports = {
  transformPaginatedComplianceRecordResults,
  transformComplianceRecord,
};

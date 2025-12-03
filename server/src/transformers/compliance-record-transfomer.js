const { cleanObject } = require('../utils/object-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');

/**
 * @typedef {Object} ComplianceRecordRow
 * @property {string} compliance_record_id
 * @property {string} type
 * @property {string} document_number
 * @property {string|null} issued_date
 * @property {string|null} expiry_date
 * @property {string|null} description
 *
 * @property {string} status_id
 * @property {string} status_name
 * @property {string|null} status_date
 *
 * @property {string|null} created_at
 * @property {string|null} updated_at
 *
 * @property {string|null} created_by
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 *
 * @property {string|null} updated_by
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 *
 * @property {string} sku_id
 * @property {string} sku_code
 * @property {string|null} size_label
 * @property {string|null} market_region
 *
 * @property {string} product_id
 * @property {string} product_name
 * @property {string|null} brand
 * @property {string|null} series
 * @property {string|null} category
 */

/**
 * Transforms a single raw SQL row from the compliance record query
 * into a normalized API response object.
 *
 * @param {ComplianceRecordRow} row - Raw SQL row from query.
 * @returns {Object|null} Normalized compliance record response.
 */
const transformComplianceRecordRow = (row) => {
  if (!row) return null;

  return cleanObject({
    id: row.compliance_record_id,
    type: row.type,
    documentNumber: row.document_number,
    issuedDate: row.issued_date,
    expiryDate: row.expiry_date,
    description: row.description,

    status: {
      id: row.status_id,
      name: row.status_name,
      date: row.status_date,
    },

    audit: compactAudit(makeAudit(row)),

    sku: {
      id: row.sku_id,
      sku: row.sku_code,
      sizeLabel: row.size_label,
      marketRegion: row.market_region,
    },

    product: {
      id: row.product_id,
      name: row.product_name,
      brand: row.brand,
      series: row.series,
      category: row.category,
      displayName: getProductDisplayName(row),
    },
  });
};

/**
 * Applies `transformComplianceRecordRow` to each row of a paginated
 * SQL result object and returns the normalized paginated response.
 *
 * @template T
 * @param {import('../../types').PaginatedQueryResult<ComplianceRecordRow>} paginatedResult
 * @returns {import('../../types').PaginatedTransformedResult<T>}
 */
const transformPaginatedComplianceRecordResults = (paginatedResult) => {
  return transformPaginatedResult(
    paginatedResult,
    transformComplianceRecordRow
  );
};

/**
 * @typedef {Object} SliceSkuDetailCompliance
 * @description
 * Output from `sliceComplianceRecordsForUser()`. All fields are already
 * permission-filtered and safe for transformer usage.
 *
 * @property {string} id                                   - Compliance record ID
 * @property {string} type                                 - Compliance type (NPN, FDA, COA, etc.)
 * @property {string} complianceId                         - Compliance document number
 * @property {string|Date} issuedDate                      - Date the compliance was issued
 * @property {string|Date} expiryDate                      - Expiration date
 * @property {Object} metadata                             - Metadata container
 * @property {Object} [metadata.status]                    - Optional status info
 * @property {string} metadata.status.id                   - Status UUID
 * @property {string} metadata.status.name                 - Status name
 * @property {string|Date} metadata.status.date            - Status timestamp
 * @property {string} metadata.description                 - Description or note for the compliance record
 * @property {Object} [audit]                              - Optional audit metadata
 * @property {Object|null} audit.createdBy                 - Creator identity
 * @property {string} audit.createdBy.id                   - Creator user ID
 * @property {string} audit.createdBy.firstname            - Creator first name
 * @property {string} audit.createdBy.lastname             - Creator last name
 * @property {Object|null} audit.updatedBy                 - Updater identity
 * @property {string} audit.updatedBy.id                   - Updater user ID
 * @property {string} audit.updatedBy.firstname            - Updater first name
 * @property {string} audit.updatedBy.lastname             - Updater last name
 */

/**
 * @typedef {Object} SkuDetailCompliance
 * @property {string} id
 * @property {string} type
 * @property {string} complianceId
 * @property {string|Date|null} issuedDate
 * @property {string|Date|null} expiryDate
 */

/**
 * Transform a *sliced* compliance record into the final API-safe DTO.
 *
 * This function converts a permission-filtered compliance row
 * (SliceSkuDetailCompliance) into the normalized output structure
 * used in SKU detail responses (SkuDetailCompliance).
 *
 * Permission filtering MUST be handled upstream in
 * sliceComplianceRecordsForUser(). This transformer performs
 * only pure, stateless, null-safe field mapping.
 *
 * @param {SliceSkuDetailCompliance|null} row
 *        A single compliance record already processed by
 *        sliceComplianceRecordsForUser().
 *
 * @returns {SkuDetailCompliance|null}
 *        Normalized compliance DTO for the API.
 */
const transformComplianceRecord = (row) => {
  if (!row) return null;

  // Optional metadata
  const metadata = row.metadata
    ? {
        status: row.metadata.status
          ? {
              id: row.metadata.status.id,
              name: row.metadata.status.name,
              date: row.metadata.status.date,
            }
          : undefined,
        description: row.metadata.description,
      }
    : undefined;

  return {
    id: row.id,
    type: row.type,
    complianceId: row.complianceNumber,
    issuedDate: row.issuedDate,
    expiryDate: row.expiryDate,
    metadata,
    audit: row.audit,
  };
};

module.exports = {
  transformPaginatedComplianceRecordResults,
  transformComplianceRecord,
};

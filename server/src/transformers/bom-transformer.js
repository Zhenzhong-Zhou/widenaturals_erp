const { getProductDisplayName } = require('../utils/display-name-utils');
const { getFullName } = require('../utils/name-utils');
const { cleanObject } = require('../utils/object-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');

/**
 * @typedef {Object} ComplianceInfo
 * @property {string|null} id - UUID of the compliance record.
 * @property {string|null} type - Compliance type (e.g., 'NPN', 'FDA').
 * @property {string|null} number - Compliance or license number.
 * @property {string|null} status - Human-readable compliance status name.
 * @property {string|null} issuedDate - Date the compliance was issued (ISO string).
 * @property {string|null} expiryDate - Date the compliance expires (ISO string).
 */

/**
 * @typedef {Object} ProductInfo
 * @property {string} id - Product UUID.
 * @property {string} name - Product display name.
 * @property {string|null} brand - Product brand.
 * @property {string|null} series - Product series.
 * @property {string|null} category - Product category.
 */

/**
 * @typedef {Object} SKUInfo
 * @property {string} id - SKU UUID.
 * @property {string} code - SKU code (unique per variant).
 * @property {string|null} barcode - SKU barcode string.
 * @property {string|null} language - Language code (e.g., 'en', 'fr').
 * @property {string|null} countryCode - Country code (e.g., 'CA', 'US').
 * @property {string|null} marketRegion - Market region name.
 * @property {string|null} sizeLabel - SKU size label (e.g., "60 Capsules").
 * @property {string|null} description - SKU-level description.
 * @property {ComplianceInfo|null} compliance - Linked compliance record.
 */

/**
 * @typedef {Object} BOMStatus
 * @property {string|null} id - UUID of BOM status.
 * @property {string|null} name - Status name (e.g., 'Active', 'Draft').
 * @property {string|null} date - Date when this status was applied (ISO string).
 */

/**
 * @typedef {Object} BOMAudit
 * @property {string} createdAt - Timestamp when the BOM was created.
 * @property {{ id: string, name: string }} createdBy - User who created the BOM.
 * @property {string|null} updatedAt - Timestamp when BOM was last updated.
 * @property {{ id: string, name: string }|null} updatedBy - User who last updated the BOM, or null.
 */

/**
 * @typedef {Object} BOMInfo
 * @property {string} id - BOM UUID.
 * @property {string} code - BOM code (e.g., 'BOM-CH-HN100-R-CN').
 * @property {string} name - Human-readable BOM name.
 * @property {number} revision - Revision number.
 * @property {boolean} isActive - Whether the BOM is active.
 * @property {boolean} isDefault - Whether this BOM is the default for its SKU.
 * @property {string|null} description - BOM description text.
 * @property {BOMStatus} status - Current BOM status info.
 * @property {BOMAudit} audit - Audit information (created/updated metadata).
 */

/**
 * @typedef {Object} BOMRecord
 * @property {ProductInfo} product - Product-level details.
 * @property {SKUInfo} sku - SKU-level details, including compliance info.
 * @property {BOMInfo} bom - BOM-level information and audit details.
 */

/**
 * @typedef {Object} RawBOMRow
 * @property {string} product_id
 * @property {string} product_name
 * @property {string} brand
 * @property {string} series
 * @property {string} category
 * @property {string} sku_id
 * @property {string} sku_code
 * @property {string} barcode
 * @property {string} language
 * @property {string} country_code
 * @property {string} market_region
 * @property {string} size_label
 * @property {string} sku_description
 * @property {string|null} compliance_id
 * @property {string|null} compliance_type
 * @property {string|null} compliance_number
 * @property {string|null} compliance_status
 * @property {string|null} compliance_issued_date
 * @property {string|null} compliance_expiry_date
 * @property {string} bom_id
 * @property {string} bom_code
 * @property {string} bom_name
 * @property {number} bom_revision
 * @property {boolean} is_active
 * @property {boolean} is_default
 * @property {string|null} bom_description
 * @property {string|null} bom_status_id
 * @property {string|null} bom_status
 * @property {string|null} bom_status_date
 * @property {string} bom_created_at
 * @property {string} bom_created_by
 * @property {string|null} bom_created_by_firstname
 * @property {string|null} bom_created_by_lastname
 * @property {string|null} bom_updated_at
 * @property {string|null} bom_updated_by
 * @property {string|null} bom_updated_by_firstname
 * @property {string|null} bom_updated_by_lastname
 */

/**
 * Transform a single flat SQL BOM row into a structured object.
 *
 * Converts flattened joined columns from `getPaginatedBoms()` into nested objects
 * grouped by `product`, `sku`, and `bom`, each with clearly named sub-properties.
 *
 * @param {RawBOMRow} row - Flat SQL result row from the paginated BOM query.
 * @returns {BOMRecord|null} Structured BOM record or null if invalid.
 */
const transformBomRow = (row) => {
  if (!row) return null;
  
  const productName = getProductDisplayName(row);
  
  const base = {
    product: {
      id: row.product_id,
      name: productName,
      brand: row.brand,
      series: row.series,
      category: row.category,
    },
    sku: {
      id: row.sku_id,
      code: row.sku_code,
      barcode: row.barcode,
      language: row.language,
      countryCode: row.country_code,
      marketRegion: row.market_region,
      sizeLabel: row.size_label,
      description: row.sku_description,
      compliance: cleanObject({
        id: row.compliance_id,
        type: row.compliance_type,
        number: row.compliance_number,
        status: row.compliance_status,
        issuedDate: row.compliance_issued_date,
        expiryDate: row.compliance_expiry_date,
      }),
    },
    bom: {
      id: row.bom_id,
      code: row.bom_code,
      name: row.bom_name,
      revision: row.bom_revision,
      isActive: row.is_active,
      isDefault: row.is_default,
      description: row.bom_description,
      status: {
        id: row.bom_status_id,
        name: row.bom_status,
        date: row.bom_status_date,
      },
      audit: {
        createdAt: row.bom_created_at,
        createdBy: {
          id: row.bom_created_by,
          name: getFullName(
            row.bom_created_by_firstname,
            row.bom_created_by_lastname
          ),
        },
        updatedAt: row.bom_updated_at,
        updatedBy: row.bom_updated_by
          ? {
            id: row.bom_updated_by,
            name: getFullName(
              row.bom_updated_by_firstname,
              row.bom_updated_by_lastname
            ),
          }
          : null,
      },
    },
  };
  
  return cleanObject(base);
};

/**
 * Transform paginated BOM query results into structured BOM objects
 * with attached pagination metadata.
 *
 * @param {{
 *   rows: Object[],
 *   pagination: { page: number, limit: number, totalRecords: number, totalPages: number }
 * }} paginatedResult - Raw result from `paginateQuery()`.
 *
 * @returns {{
 *   data: BOMRecord[],
 *   pagination: { page: number, limit: number, totalRecords: number, totalPages: number }
 * }} Transformed BOM list with pagination info.
 */
const transformPaginatedOBoms = (paginatedResult) => {
  return transformPaginatedResult(paginatedResult, (row) =>
    transformBomRow(row)
  );
};

module.exports = {
  transformPaginatedOBoms,
};

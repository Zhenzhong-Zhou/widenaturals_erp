/**
 * @file compliance-record-types.js
 * @description JSDoc typedefs for the compliance record domain.
 *
 * Two categories of types:
 *   - Row types    – raw DB column aliases from repository queries
 *   - Record types – transformed UI-facing shapes
 *
 * Nullable fields are those sourced from LEFT JOINed tables.
 * `_by` fields are user UUIDs typed as `string|null`, not dates.
 */

'use strict';

// ---------------------------------------------------------------------------
// Row types (raw DB shapes)
// ---------------------------------------------------------------------------

/**
 * Raw DB row returned by the paginated compliance record query.
 *
 * @typedef {Object} ComplianceRecordRow
 * @property {string}      compliance_record_id
 * @property {string}      type
 * @property {string}      document_number
 * @property {string|null} issued_date
 * @property {string|null} expiry_date
 * @property {string}      status_id
 * @property {string}      status_name
 * @property {string|null} status_date
 * @property {string|null} created_at
 * @property {string|null} updated_at
 * @property {string|null} created_by
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 * @property {string|null} updated_by
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 * @property {string}      sku_id
 * @property {string}      sku_code
 * @property {string}      country_code
 * @property {string|null} size_label
 * @property {string|null} market_region
 * @property {string}      product_id
 * @property {string}      product_name
 * @property {string|null} brand
 * @property {string|null} series
 * @property {string|null} category
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * Transformed compliance record for paginated table view.
 *
 * @typedef {Object} ComplianceRecordResult
 * @property {string}      id
 * @property {string}      type
 * @property {string}      documentNumber
 * @property {string|null} issuedDate
 * @property {string|null} expiryDate
 * @property {{ id: string, name: string, date: string|null }} status
 * @property {Object}      audit
 * @property {{ id: string, sku: string, sizeLabel: string|null, marketRegion: string|null }} sku
 * @property {{
 *   id: string,
 *   name: string,
 *   brand: string|null,
 *   series: string|null,
 *   category: string|null,
 *   displayName: string
 * }} product
 */

/**
 * Permission-filtered compliance row from `sliceComplianceRecordsForUser`.
 * All fields are already permission-scoped — transformer does pure field mapping only.
 *
 * @typedef {Object} SliceSkuDetailCompliance
 * @property {string}           id
 * @property {string}           type
 * @property {string}           complianceNumber
 * @property {string|Date|null} issuedDate
 * @property {string|Date|null} expiryDate
 * @property {{
 *   status?: { id: string, name: string, date: string|Date },
 *   description: string
 * }} [metadata]
 * @property {Object} [audit]
 */

/**
 * Transformed compliance record for SKU detail view.
 *
 * @typedef {Object} SkuDetailCompliance
 * @property {string}           id
 * @property {string}           type
 * @property {string}           complianceId
 * @property {string|Date|null} issuedDate
 * @property {string|Date|null} expiryDate
 * @property {{
 *   status?: { id: string, name: string, date: string|Date },
 *   description: string
 * }} [metadata]
 * @property {Object} [audit]
 */

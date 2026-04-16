/**
 * @file address-transformer.js
 * @description Row-level and page-level transformers for address records.
 *
 * Exports:
 *   - transformEnrichedAddresses        – transforms enriched address rows (detail/insert view)
 *   - transformPaginatedAddressResults  – transforms a paginated result set (table view)
 *
 * Internal helpers (not exported):
 *   - buildAddressObject        – extracts address fields from a flat DB row into a structured object
 *   - transformEnrichedAddress  – transforms a single enriched address row
 *   - transformPaginatedAddressRow – transforms a single paginated address row
 */

'use strict';

const {
  transformRows,
  transformPageResult,
} = require('../utils/transformer-utils');
const { cleanObject } = require('../utils/object-utils');
const { getFullName } = require('../utils/person-utils');
const { formatAddress } = require('../utils/address-utils');

/**
 * Extracts address fields from a flat DB row into a structured address object.
 *
 * Used by both enriched and paginated transformers to avoid duplication.
 * Intentionally keeps all fields nullable — `cleanObject` is applied by callers.
 *
 * @param {Object} row - Raw DB row containing address columns.
 * @returns {{ line1, line2, city, state, postalCode, country, region }}
 */
const buildAddressObject = (row) => ({
  line1: row.address_line1 ?? null,
  line2: row.address_line2 ?? null,
  city: row.city ?? null,
  state: row.state ?? null,
  postalCode: row.postal_code ?? null,
  country: row.country ?? null,
  region: row.region ?? null,
});

/**
 * Transforms a single enriched address DB row into the detail/insert response shape.
 *
 * Spreads address fields flat onto the root object (not nested under `address`).
 * `cleanObject` is applied to the full result — nulls from `buildAddressObject`
 * are pruned at the outer level.
 *
 * @param {Object} row - Raw enriched DB row (joined with customer and user data).
 * @returns {Object} Transformed address record.
 */
const transformEnrichedAddress = (row) => {
  const addressObj = buildAddressObject(row);

  return cleanObject({
    id: row.id,
    customerId: row.customer_id ?? null,
    recipientName: row.recipient_name ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    label: row.label ?? null,

    // Address fields spread flat onto the root shape (not nested).
    ...addressObj,

    note: row.note ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,

    createdBy: {
      firstname: row.created_by_firstname ?? null,
      lastname: row.created_by_lastname ?? null,
      fullName: getFullName(row.created_by_firstname, row.created_by_lastname),
    },
    updatedBy: {
      firstname: row.updated_by_firstname ?? null,
      lastname: row.updated_by_lastname ?? null,
      fullName: getFullName(row.updated_by_firstname, row.updated_by_lastname),
    },
    customer: {
      type: row.customer_type ?? null,
      firstname: row.customer_firstname ?? null,
      lastname: row.customer_lastname ?? null,
      companyName: row.customer_company_name ?? null,
      fullName:
        row.customer_type === 'company'
          ? (row.customer_company_name ?? null)
          : getFullName(row.customer_firstname, row.customer_lastname),
      email: row.customer_email ?? null,
      phoneNumber: row.customer_phone_number ?? null,
    },

    displayAddress: formatAddress(addressObj),
  });
};

/**
 * Transforms a single paginated address DB row into the table view shape.
 *
 * Address fields are nested under `address` (not flat) — distinct from the
 * enriched shape. `cleanObject` is applied both to the nested address object
 * and to the full result row.
 *
 * @param {Object} row - Raw DB row from the paginated address query.
 * @returns {Object} Transformed address row for table view.
 */
const transformPaginatedAddressRow = (row) => {
  const addressObj = buildAddressObject(row);

  return cleanObject({
    id: row.id,
    customerId: row.customer_id,
    customerType: row.customer_type,
    customerName:
      row.customer_type === 'company'
        ? row.customer_company_name || null
        : getFullName(row.customer_firstname, row.customer_lastname),
    customerEmail: row.customer_email ?? null,
    companyName: row.company_name ?? null,

    label: row.label ?? null,
    recipientName: row.recipient_name ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,

    // Address fields nested (table view shape — differs from enriched flat spread).
    address: cleanObject(addressObj),
    displayAddress: formatAddress(addressObj),

    note: row.note ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,

    createdBy: getFullName(row.created_by_firstname, row.created_by_lastname),
    updatedBy: getFullName(row.updated_by_firstname, row.updated_by_lastname),
  });
};

/**
 * Transforms an array of enriched address rows into the detail/insert response shape.
 *
 * Delegates per-row transformation to `transformEnrichedAddress`.
 *
 * @param {Array<Object>} rows - Raw enriched DB rows.
 * @returns {Array<Object>} Transformed address records.
 */
const transformEnrichedAddresses = (rows) =>
  transformRows(rows, transformEnrichedAddress);

/**
 * Transforms a paginated address result set into the table view response shape.
 *
 * Delegates per-row transformation to `transformPaginatedAddressRow` via
 * `transformPageResult`, which preserves pagination metadata.
 *
 * @param {Object} paginatedResult          - Raw paginated result from the repository.
 * @param {Array<Object>} paginatedResult.data - Raw DB rows.
 * @param {Object} paginatedResult.pagination  - Pagination metadata.
 * @returns {Promise<PaginatedResult<Object>>} Transformed records and pagination metadata.
 */
const transformPaginatedAddressResults = (paginatedResult) =>
  transformPageResult(paginatedResult, transformPaginatedAddressRow);

module.exports = {
  transformEnrichedAddresses,
  transformPaginatedAddressResults,
};

const {
  transformRows,
  transformPaginatedResult,
} = require('../utils/transformer-utils');
const { cleanObject } = require('../utils/object-utils');
const { getFullName } = require('../utils/name-utils');
const { formatAddress } = require('../utils/address-utils');

/**
 * Builds a structured address object from a DB row.
 *
 * @param {Object} row - Raw DB row containing address fields.
 * @returns {Object} Address object with clean keys.
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
 * Transforms an enriched address row from the DB into a clean object.
 *
 * @param {Object} row - Raw row from the enriched address query.
 * @returns {Object} Transformed address record.
 */
const transformEnrichedAddress = (row) => {
  const addressObj = buildAddressObject(row);

  const transformedAddress = {
    id: row.id,
    customerId: row.customer_id ?? null,
    recipientName: row.recipient_name ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    label: row.label ?? null,

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
      firstname: row.customer_firstname ?? null,
      lastname: row.customer_lastname ?? null,
      fullName: getFullName(row.customer_firstname, row.customer_lastname),
      email: row.customer_email ?? null,
      phoneNumber: row.customer_phone_number ?? null,
    },

    displayAddress: formatAddress(addressObj),
  };

  return cleanObject(transformedAddress);
};

/**
 * Transforms an array of enriched address rows from the database
 * into clean and structured address objects.
 *
 * - Applies `transformEnrichedAddress` to each row.
 * - Ensures input is an array; returns an empty array if not.
 *
 * @param {Array<object>} rows - Array of raw DB rows with address, customer, and user metadata.
 * @returns {Array<object>} Array of cleaned and transformed address objects.
 */
const transformEnrichedAddresses = (rows) =>
  transformRows(rows, transformEnrichedAddress);

/**
 * Transforms a paginated address row into a client-friendly object.
 *
 * @param {Object} row - Raw DB row from a paginated address query.
 * @returns {Object} Transformed address object.
 */
const transformPaginatedAddressRow = (row) => {
  const addressObj = buildAddressObject(row);

  const result = {
    id: row.id,
    customerId: row.customer_id,
    customerName: getFullName(row.customer_firstname, row.customer_lastname),
    customerEmail: row.customer_email ?? null,

    label: row.label ?? null,
    recipientName: row.recipient_name ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,

    address: cleanObject(addressObj),
    displayAddress: formatAddress(addressObj),

    note: row.note ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,

    createdBy: getFullName(row.created_by_firstname, row.created_by_lastname),
    updatedBy: getFullName(row.updated_by_firstname, row.updated_by_lastname),
  };

  return cleanObject(result);
};

/**
 * Transforms a paginated address query result by applying the address row transformer
 * to each row in the result set.
 *
 * @param {Object} paginatedResult - The raw-paginated result from the DB query.
 * @param {Array<Object>} paginatedResult.rows - The raw address rows.
 * @param {number} paginatedResult.totalRecords - Total record count.
 * @param {number} paginatedResult.totalPages - Total page counts.
 * @param {number} paginatedResult.page - Current page number.
 * @param {number} paginatedResult.limit - Page size.
 *
 * @returns {Object} Transformed paginated result where rows contain
 * cleaned and formatted address data.
 */
const transformPaginatedAddressResults = (paginatedResult) => {
  return transformPaginatedResult(
    paginatedResult,
    transformPaginatedAddressRow
  );
};

module.exports = {
  transformEnrichedAddresses,
  transformPaginatedAddressResults,
};

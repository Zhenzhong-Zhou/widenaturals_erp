const { cleanObject } = require('../utils/object-utils');
const { formatAddress } = require('../utils/string-utils');
const { getFullName } = require('../utils/name-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');

/**
 * Transforms a raw DB row with joins into a clean enriched customer object.
 *
 * @param {object} row - Raw DB result row.
 * @returns {object} Transformed and cleaned a customer object.
 */
const transformEnrichedCustomer = (row) => {
  const transformed = {
    id: row.id ?? null,
    firstname: row.firstname ?? null,
    lastname: row.lastname ?? null,
    email: row.email ?? null,
    phoneNumber: row.phone_number ?? null,
    address: formatAddress(row),
    note: row.note ?? null,
    status: {
      id: row.status_id ?? null,
      name: row.status_name ?? null,
    },
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    createdBy: {
      firstname: row.created_by_firstname ?? null,
      lastname: row.created_by_lastname ?? null,
    },
    updatedBy: {
      firstname: row.updated_by_firstname ?? null,
      lastname: row.updated_by_lastname ?? null,
    },
  };
  
  return cleanObject(transformed); // final clean sweep
};

/**
 * Transforms an array of enriched customer rows from the database into
 * clean and structured customer objects.
 *
 * - Use `transformEnrichedCustomer` to format and sanitize each row.
 * - Ensures input is an array; returns an empty array if not.
 *
 * @param {Array<object>} rows - Array of raw DB rows with customer, status, and user metadata.
 * @returns {Array<object>} Array of cleaned and transformed customer objects.
 */
const transformEnrichedCustomers = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows.map(transformEnrichedCustomer);
};

/**
 * Transforms a raw customer row into a formatted customer object.
 *
 * - Combines first and last names into `customerName`, `createdBy`, and `updatedBy`
 * - Normalizes null/empty values
 * - Cleans up any undefined/null values in the output
 *
 * @param {Object} row - Raw DB row from customer query
 * @returns {Object} Transformed and cleaned a customer object
 */
const transformCustomerRow = (row) =>
  cleanObject({
    id: row.id,
    customerName: getFullName(row.firstname, row.lastname),
    email: row.email,
    phoneNumber: row.phone_number,
    statusId: row.status_id,
    statusName: row.status_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: getFullName(row.created_by_firstname, row.created_by_lastname),
    updatedBy: getFullName(row.updated_by_firstname, row.updated_by_lastname),
  });

/**
 * Transforms a paginated result set of raw customer rows into structured, display-ready objects.
 *
 * Applies `transformCustomerRow` to each row in the result set and preserves pagination metadata.
 * This function is a wrapper around `transformPaginatedResult` specialized for customer records.
 *
 * @param {Object} paginatedResult - The raw paginated customer result from the repository layer
 * @returns {{ data: CustomerResponse[], pagination: Object }} - Transformed customer data with pagination
 */
const transformPaginatedCustomerResults = (paginatedResult) =>
  transformPaginatedResult(paginatedResult, transformCustomerRow);

module.exports = {
  transformEnrichedCustomers,
  transformPaginatedCustomerResults,
};

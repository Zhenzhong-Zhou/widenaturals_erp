const { cleanObject } = require('../utils/object-utils');
const { formatAddress } = require('../utils/string-utils');

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

module.exports = {
  transformEnrichedCustomers,
};

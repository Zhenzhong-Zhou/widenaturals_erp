const { transformRows } = require('../utils/transformer-utils');
const { cleanObject } = require('../utils/object-utils');
const { getFullName } = require('../utils/name-utils');
const { formatAddress } = require('../utils/string-utils');

/**
 * Transforms an enriched address row from the DB into a clean object.
 *
 * @param {Object} row - Raw row from the enriched address query.
 * @returns {Object} Transformed address record.
 */
const transformEnrichedAddress = (row) => {
  const transformedAddress = {
    id: row.id,
    customerId: row.customer_id ?? null,
    recipientName: row.recipient_name ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    label: row.label ?? null,
    addressLine1: row.address_line1 ?? null,
    addressLine2: row.address_line2 ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    postalCode: row.postal_code ?? null,
    country: row.country ?? null,
    region: row.region ?? null,
    note: row.note ?? null,
    addressHash: row.address_hash ?? null,
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
    displayAddress: formatAddress(row),
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

module.exports = {
  transformEnrichedAddresses
};

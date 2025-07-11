const { cleanObject } = require('../utils/object-utils');
const { getFullName } = require('../utils/name-utils');
const { transformPaginatedResult, transformRows } = require('../utils/transformer-utils');

/**
 * Transforms a customer row into a structured or flat object.
 *
 * - Handles data from queries that join status and user metadata.
 * - Can output either nested or flat format depending on options.
 * - Cleans null/undefined properties using `cleanObject`.
 *
 * @param {object} row - Raw customer DB row with joined fields.
 * @param {object} [options] - Transformation options.
 * @param {('nested'|'flat')} [options.format='nested'] - Output format.
 *   - 'nested': returns nested objects (e.g., status, createdBy, updatedBy).
 *   - 'flat': returns flattened presentation-friendly structure.
 * @returns {object} Transformed customer object.
 *
 * @example
 * transformCustomerRow(row, { format: 'nested' });
 * transformCustomerRow(row, { format: 'flat' });
 */
const transformCustomerRow = (row, { format = 'nested' } = {}) => {
  const base = {
    id: row.id ?? null,
    firstname: row.firstname ?? null,
    lastname: row.lastname ?? null,
    email: row.email ?? null,
    phoneNumber: row.phone_number ?? null,
    note: row.note ?? null,
    status: {
      id: row.status_id ?? null,
      name: row.status_name ?? null,
    },
    hasAddress: row.has_address ?? null,
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
  
  if (format === 'flat') {
    return cleanObject({
      id: base.id,
      customerName: getFullName(base.firstname, base.lastname),
      email: base.email,
      phoneNumber: base.phoneNumber,
      statusId: base.status.id,
      statusName: base.status.name,
      hasAddress: base.hasAddress,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
      createdBy: getFullName(base.createdBy.firstname, base.createdBy.lastname),
      updatedBy: getFullName(base.updatedBy.firstname, base.updatedBy.lastname),
    });
  }
  
  return cleanObject(base);
};

/**
 * Transforms an array of customer rows from the database into
 * clean and structured customer objects (nested format).
 *
 * - Applies `transformCustomerRow` in nested mode.
 * - Ensures input is an array; returns an empty array if not.
 *
 * @param {Array<object>} rows - Array of raw DB rows with customer, status, and user metadata.
 * @returns {Array<object>} Array of cleaned and transformed customer objects.
 */
const transformEnrichedCustomers = (rows) =>
  transformRows(rows, (row) =>
    transformCustomerRow(row, { format: 'nested' }));

/**
 * Transforms a paginated result set of raw customer rows into structured, display-ready objects.
 *
 * - Applies `transformCustomerRow` in flat mode to each row.
 * - Uses `transformPaginatedResult` to apply transformation and preserve pagination metadata.
 *
 * @param {Object} paginatedResult - The raw-paginated customer result from the repository layer.
 * @returns {{ data: CustomerResponse[], pagination: Object }} Transformed customer data with pagination info.
 */
const transformPaginatedCustomerResults = (paginatedResult) => {
  return transformPaginatedResult(
    paginatedResult,
    (row) => transformCustomerRow(row, { format: 'flat' })
  );
};

module.exports = {
  transformEnrichedCustomers,
  transformPaginatedCustomerResults,
};

const { validateBulkInsertRows } = require('../database/db-utils');
const { bulkInsert, query, paginateQuery } = require('../database/db');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { buildAddressFilter } = require('../utils/sql/build-address-filters');

/**
 * Bulk inserts address records with conflict handling.
 *
 * - Transforms and inserts validated address data into the database.
 * - On conflict (matching `address_hash` or another defined conflict key), updates defined fields.
 * - Primarily used for insert operations, with conflict resolution as fallback.
 *
 * @param {Array<Object>} addresses - Array of validated address objects.
 * @param {Object} client - Optional DB client for transactional context.
 * @returns {Promise<Array<Object>>} - Array of inserted or updated address records.
 * @throws {AppError} - Throws on validation or database error.
 */
const insertAddressRecords = async (addresses, client) => {
  const columns = [
    'customer_id',
    'full_name',
    'phone',
    'email',
    'label',
    'address_line1',
    'address_line2',
    'city',
    'state',
    'postal_code',
    'country',
    'region',
    'note',
    'address_hash',
    'created_at',
    'updated_at',
    'created_by',
    'updated_by',
  ];
  
  const updateColumns = [
    'full_name',
    'phone',
    'email',
    'label',
    'address_line1',
    'address_line2',
    'city',
    'state',
    'postal_code',
    'country',
    'region',
    'note',
    'address_hash',
    'updated_at',
    'updated_by',
  ];
  
  const updateStrategies = Object.fromEntries(updateColumns.map((col) => [col, 'overwrite']));
  
  const now = new Date();
  
  const rows = addresses.map((address) => [
    address.customer_id || null,
    address.full_name || null,
    address.phone || null,
    address.email || null,
    address.label || null,
    address.address_line1,
    address.address_line2 || null,
    address.city,
    address.state || null,
    address.postal_code,
    address.country || 'Canada',
    address.region || null,
    address.note || null,
    address.address_hash || null,
    now,                  // created_at
    null,                 // updated_at at insert time
    address.created_by || null,
    null,                 // updated_by at insert time
  ]);
  
  try {
    validateBulkInsertRows(rows, columns.length);
    
    return await bulkInsert(
      'addresses',
      columns,
      rows,
      ['customer_id', 'address_hash'],
      updateStrategies,
      client
    );
  } catch (error) {
    logSystemException(error, 'Bulk Insert Failed', {
      context: 'address-repository/insertAddressRecords',
      table: 'addresses',
      columns,
      conflictColumns: ['address_hash'],
      rowCount: rows.length
    });
    throw AppError.databaseError('Bulk insert operation failed', {
      details: { tableName: 'addresses', error: error.message },
    });
  }
};

/**
 * Fetches enriched address records by ID.
 *
 * - Retrieves address details along with associated customer, creator, and updater metadata.
 * - Joins with `users` table for created_by and updated_by names.
 * - Joins with `customers` table for customer name, email, and phone number.
 * - Designed for use in admin views, audit logs, or detailed API responses.
 *
 * @param {string[]} ids - Array of address UUIDs to fetch.
 * @param {object} [client] - Optional PostgreSQL client for transactional context.
 * @returns {Promise<Array<Object>>} - Array of enriched address records.
 * @throws {AppError} If query fails or invalid parameters are passed.
 */
const getEnrichedAddressesByIds = async (ids, client) => {
  const sql = `
    SELECT
      a.id,
      a.customer_id,
      a.full_name AS recipient_name,
      a.phone,
      a.email,
      a.label,
      a.address_line1,
      a.address_line2,
      a.city,
      a.state,
      a.postal_code,
      a.country,
      a.region,
      a.note,
      a.created_at,
      a.updated_at,
      cu.firstname AS created_by_firstname,
      cu.lastname AS created_by_lastname,
      uu.firstname AS updated_by_firstname,
      uu.lastname AS updated_by_lastname,
      c.firstname AS customer_firstname,
      c.lastname AS customer_lastname,
      c.email AS customer_email,
      c.phone_number AS customer_phone_number
    FROM addresses a
    LEFT JOIN customers c ON c.id = a.customer_id
    LEFT JOIN users cu ON cu.id = a.created_by
    LEFT JOIN users uu ON uu.id = a.updated_by
    WHERE a.id = ANY($1)
  `;
  
  try {
    const result = await query(sql, [ids], client);
    return result.rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch enriched address records', {
      context: 'address-repository/getEnrichedAddressesByIds',
      ids,
    });
    throw AppError.databaseError('Failed to retrieve address records.');
  }
};

/**
 * Fetches paginated addresses with optional filtering and sorting.
 *
 * Joins customer and user information for display purposes.
 *
 * @param {Object} options - Options for pagination, filtering, and sorting.
 * @param {Object} [options.filters={}] - Filters to apply to the address query.
 * @param {number} [options.page=1] - Page number (1-based).
 * @param {number} [options.limit=10] - Number of records per page.
 * @param {string} [options.sortBy='created_at'] - Field to sort by.
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC'] - Sort order.
 *
 * @returns {Promise<Object>} Paginated result with data and metadata (e.g. total records).
 *
 * @throws {AppError} When the query fails.
 */
const getPaginatedAddresses = async ({
                                       filters = {},
                                       page = 1,
                                       limit = 10,
                                       sortBy = 'created_at',
                                       sortOrder = 'DESC',
                                     }) => {
  const { whereClause, params } = buildAddressFilter(filters);
  
  const tableName = 'addresses a';
  const joins = [
    'LEFT JOIN users u1 ON a.created_by = u1.id',
    'LEFT JOIN users u2 ON a.updated_by = u2.id',
    'LEFT JOIN customers c ON a.customer_id = c.id',
  ];
  
  const baseQuery = `
    SELECT
      a.id,
      a.customer_id,
      a.label,
      a.full_name AS recipient_name,
      a.phone,
      a.email,
      a.address_line1,
      a.address_line2,
      a.city,
      a.state,
      a.postal_code,
      a.country,
      a.region,
      a.note,
      a.created_at,
      a.updated_at,
      u1.firstname AS created_by_firstname,
      u1.lastname AS created_by_lastname,
      u2.firstname AS updated_by_firstname,
      u2.lastname AS updated_by_lastname,
      c.firstname AS customer_firstname,
      c.lastname AS customer_lastname,
      c.email AS customer_email
    FROM ${tableName}
    ${joins.join('\n')}
    WHERE ${whereClause}
  `;
  
  try {
    const result = await paginateQuery({
      tableName,
      joins,
      whereClause,
      queryText: baseQuery,
      params,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    logSystemInfo('Fetched paginated addresses', {
      context: 'address-repository/fetchPaginatedAddresses',
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch paginated addresses', {
      context: 'address-repository/fetchPaginatedAddresses',
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    throw AppError.databaseError('Failed to fetch addresses.');
  }
};

/**
 * Retrieves all addresses associated with a given customer ID.
 *
 * This function fetches minimal address data for customer selection contexts
 * such as shipping or billing options. The payload includes only essential fields
 * for lightweight rendering.
 *
 * Results are ordered by creation time in descending order (newest first).
 *
 * @param {string} customerId - The UUID of the customer whose addresses are being retrieved.
 * @returns {Promise<Array<{
 *   id: string,
 *   recipient_name: string,
 *   label: string | null,
 *   address_line1: string,
 *   city: string,
 *   state: string,
 *   postal_code: string,
 *   country: string
 * }>>} A promise resolving to an array of simplified address objects.
 *
 * @throws {AppError} Throws a database error if the query fails.
 */
const getCustomerAddressLookupById = async (customerId) => {
  const queryText = `
    SELECT
      id,
      full_name AS recipient_name,
      label,
      address_line1,
      city,
      state,
      postal_code,
      country
    FROM addresses
    WHERE customer_id = $1
    ORDER BY created_at DESC;
  `;
  
  try {
    logSystemInfo('Fetching customer address lookup data', {
      context: 'address-repository/getCustomerAddressLookupById',
      customerId,
    });
    
    const { rows } = await query(queryText, [customerId]);
    return rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch customer address lookup data', {
      context: 'address-repository/getCustomerAddressLookupById',
      customerId,
    });
    throw AppError.databaseError('Failed to fetch customer addresses.');
  }
};

module.exports = {
  insertAddressRecords,
  getEnrichedAddressesByIds,
  getPaginatedAddresses,
  getCustomerAddressLookupById,
};

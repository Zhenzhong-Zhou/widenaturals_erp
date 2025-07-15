const { bulkInsert, query, paginateQuery, paginateQueryByOffset } = require('../database/db');
const AppError = require('../utils/AppError');
const {
  logSystemException,
  logSystemInfo
} = require('../utils/system-logger');
const { buildCustomerFilter } = require('../utils/sql/build-customer-filters');
const { validateBulkInsertRows } = require('../database/db-utils');

/**
 * Bulk inserts customer records with conflict handling.
 *
 * - Transforms and inserts validated customer data into the database.
 * - On conflict (matching `email` + `phone_number`), updates defined fields
 *   (e.g., status, note, metadata).
 * - Primarily used for insert operations, with conflict resolution as fallback.
 *
 * @param {Array<Object>} customers - Array of validated customer objects.
 * @param {Object} client - Optional DB client for transactional context.
 * @returns {Promise<Array<Object>>} - Array of inserted or updated customer records.
 * @throws {AppError} - Throws on validation or database error.
 */
const insertCustomerRecords = async (customers, client) => {
  const columns = [
    'firstname',
    'lastname',
    'email',
    'phone_number',
    'status_id',
    'note',
    'status_date',
    'created_at',
    'updated_at',
    'created_by',
    'updated_by',
  ];
  
  const updateColumns = [
    'firstname',
    'lastname',
    'status_id',
    'note',
    'updated_at',
    'updated_by',
  ];
  
  const updateStrategies = Object.fromEntries(updateColumns.map((col) => [col, 'overwrite']));
  
  const now = new Date();
  const rows = customers.map((customer) => [
    customer.firstname,
    customer.lastname,
    customer.email || null,
    customer.phone_number || null,
    customer.status_id,
    customer.note || null,
    now,               // status_date
    now,               // created_at
    null,              // updated_at (no update info at insert)
    customer.created_by || null,
    null,              // updated_by (no update info at insert)
  ]);
  
  try {
    validateBulkInsertRows(rows, columns.length);
    
    return await bulkInsert(
      'customers',
      columns,
      rows,
      ['email', 'phone_number'],
      updateStrategies,
      client
    );
  } catch (error) {
    logSystemException(error, 'Bulk Insert Failed', {
      context: 'customer-repository/insertCustomerRecords',
      table: 'customers',
      columns,
      conflictColumns: ['email', 'phone_number'],
    });
    throw AppError.databaseError('Bulk insert operation failed', {
      details: { tableName: 'customers', error: error.message },
    });
  }
};

/**
 * Fetches enriched customer records by ID.
 *
 * - Retrieves customer details along with status and creator/updater metadata.
 * - Performs LEFT JOINs with `status`, `users` (as created_by and updated_by).
 * - Designed for use in audit views, admin panels, or enriched display.
 *
 * @param {string[]} ids - Array of customer UUIDs to fetch.
 * @param {object} [client] - Optional PostgreSQL client for transactional context.
 * @returns {Promise<Array<Object>>} - Array of enriched customer records.
 * @throws {AppError} If query fails or invalid parameters are passed.
 */
const getEnrichedCustomersByIds = async(ids, client) => {
  const sql = `
    SELECT
      c.id,
      c.firstname,
      c.lastname,
      c.email,
      c.phone_number,
      c.note,
      c.status_id,
      s.name AS status_name,
      c.created_at,
      c.updated_at,
      cu.firstname AS created_by_firstname,
      cu.lastname AS created_by_lastname,
      uu.firstname AS updated_by_firstname,
      uu.lastname AS updated_by_lastname
    FROM customers c
    LEFT JOIN status s ON s.id = c.status_id
    LEFT JOIN users cu ON cu.id = c.created_by
    LEFT JOIN users uu ON uu.id = c.updated_by
    WHERE c.id = ANY($1)
  `;
  
  try {
    const result = await query(sql, [ids], client);
    return result.rows;
  } catch (error) {
    logSystemException(error,'Failed to fetch enriched customer records', {
      context: 'customer-repository/getEnrichedCustomersByIds',
      ids,
    });
    throw AppError.databaseError('Failed to retrieve customer records.');
  }
};

/**
 * Fetches paginated customer records with optional filtering and sorting.
 *
 * This function builds a dynamic SQL query using filters like status, region,
 * keyword search, and date ranges. It applies pagination and sorting, and joins
 * user and status metadata for enriched results.
 *
 * @param {Object} options - Query options
 * @param {Object} [options.filters={}] - Optional filter object for customers
 * @param {string} [options.statusId] - Optional default status filter (e.g. 'active')
 * @param {boolean} [options.overrideDefaultStatus=false] - Whether to ignore status filter
 * @param {number} [options.page=1] - Current page number for pagination
 * @param {number} [options.limit=10] - Number of records per page
 * @param {string} [options.sortBy='created_at'] - Column to sort by
 * @param {string} [options.sortOrder='DESC'] - Sort direction
 *
 * @returns {Promise<Array>} - Paginated customer result
 *
 * @throws {AppError} - Throws databaseError on failure
 */
const getPaginatedCustomers = async ({
                                       filters = {},
                                       statusId,
                                       overrideDefaultStatus = false,
                                       page = 1,
                                       limit = 10,
                                       sortBy = 'created_at',
                                       sortOrder = 'DESC',
                                     }) => {
  const { whereClause, params } = buildCustomerFilter(statusId, filters, {
    overrideDefaultStatus,
  });
  
  const tableName = 'customers c';
  const joins = [
    'INNER JOIN status s ON c.status_id = s.id',
    'LEFT JOIN users u1 ON c.created_by = u1.id',
    'LEFT JOIN users u2 ON c.updated_by = u2.id',
  ];
  
  const baseQuery = `
    SELECT
      c.id,
      c.firstname,
      c.lastname,
      c.email,
      c.phone_number,
      c.status_id,
      s.name AS status_name,
      EXISTS (
        SELECT 1 FROM addresses a WHERE a.customer_id = c.id
      ) AS has_address,
      c.created_at,
      c.updated_at,
      u1.firstname AS created_by_firstname,
      u1.lastname AS created_by_lastname,
      u2.firstname AS updated_by_firstname,
      u2.lastname AS updated_by_lastname
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
    
    logSystemInfo('Fetched paginated customers', {
      context: 'customer-repository/fetchPaginatedCustomers',
      filters,
      statusId,
      overrideDefaultStatus,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch paginated customers', {
      context: 'customer-repository/fetchPaginatedCustomers',
      filters,
      statusId,
      overrideDefaultStatus,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    throw AppError.databaseError('Failed to fetch customers.');
  }
};

/**
 * Fetches customer records for lookup dropdowns or autocomplete components.
 *
 * This function retrieves a lightweight, paginated list of customers,
 * applying optional keyword search and status filtering. Results are sorted
 * by firstname, lastname, and creation date for consistent dropdown ordering.
 *
 * It is optimized for lookup use cases where small, fast result sets are required.
 *
 * @param {Object} options - Options for the lookup query.
 * @param {string} [options.keyword=''] - Partial search term for firstname, lastname, email, or phone number.
 * @param {string} [options.statusId] - Optional status ID to filter customers.
 * @param {number} [options.limit=50] - Number of records to return (default: 50).
 * @param {number} [options.offset=0] - Number of records to skip for pagination (default: 0).
 * @param {boolean} [options.overrideDefaultStatus=false] - If true, disables automatic status filtering (e.g., show all statuses).
 *
 * @returns {Promise<{
 *   data: Array<{ id: string, firstname: string, lastname: string, email: string }>,
 *   pagination: {
 *     offset: number,
 *     limit: number,
 *     totalRecords: number,
 *     hasMore: boolean
 *   }
 * }>} Paginated list of customers and pagination metadata.
 *
 * @throws {AppError} Throws a database error if the query fails.
 */
const getCustomerLookup = async ({
                                   keyword = '',
                                   statusId,
                                   limit = 50,
                                   offset = 0,
                                   overrideDefaultStatus = false,
                                 }) => {
  const tableName = 'customers c';
  
  // Build dynamic WHERE clause + params
  const { whereClause, params } = buildCustomerFilter(
    statusId,
    { keyword },
    { overrideDefaultStatus }
  );
  
  // Base query text
  const queryText = `
    SELECT
      c.id,
      c.firstname,
      c.lastname,
      c.email,
      EXISTS (
        SELECT 1
        FROM addresses a
        WHERE a.customer_id = c.id
      ) AS has_address
    FROM ${tableName}
    WHERE ${whereClause}
  `;
  
  try {
    // Execute with pagination and sorting
    const result = await paginateQueryByOffset({
      tableName,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 'c.firstname',  // primary sort field
      sortOrder: 'ASC',
      additionalSort: 'c.lastname ASC, c.created_at DESC', // optional extra sorts
    });
    
    logSystemInfo('Fetched customer lookup data', {
      context: 'customer-repository/getCustomerLookup',
      keyword,
      statusId,
      offset,
      limit,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch customer lookup data', {
      context: 'customer-repository/getCustomerLookup',
      keyword,
      statusId,
      offset,
      limit,
    });
    throw AppError.databaseError('Failed to fetch customer lookup data.');
  }
};

module.exports = {
  insertCustomerRecords,
  getEnrichedCustomersByIds,
  getPaginatedCustomers,
  getCustomerLookup,
};

const {
  withTransaction,
  bulkInsert,
  query,
  retry,
  paginateQuery,
} = require('../database/db');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Checks if a customer exists by email or phone.
 * @param {string} email - Customer email.
 * @param {string} phone_number - Customer phone number.
 * @returns {Promise<boolean>} - True if customer exists, otherwise false.
 */
const checkCustomerExists = async (email, phone_number) => {
  if (!email && !phone_number) return false;

  const sql = `
    SELECT id FROM customers
    WHERE email = $1 OR phone_number = $2
    LIMIT 1;
  `;

  const result = await query(sql, [email || null, phone_number || null]);
  return result.rows.length > 0;
};

/**
 * Inserts multiple customers into the database in a transaction.
 * @param {Array} customers - List of customer objects.
 * @returns {Promise<Array>} - The inserted customers.
 */
const bulkCreateCustomers = async (customers) => {
  if (!Array.isArray(customers) || customers.length === 0) {
    throw AppError('Customer list is empty.', 400, {
      code: 'VALIDATION_ERROR',
    });
  }

  const columns = [
    'firstname',
    'lastname',
    'email',
    'phone_number',
    'address',
    'status_id',
    'note',
    'status_date',
    'created_at',
    'updated_at',
    'created_by',
    'updated_by',
  ];

  const rows = customers.map((customer) => [
    customer.firstname,
    customer.lastname,
    customer.email || null,
    customer.phone_number || null,
    customer.address || null,
    customer.status_id,
    customer.note || null,
    new Date(), // status_date
    new Date(), // created_at
    null, // updated_at
    customer.created_by,
    null,
  ]);

  return withTransaction(async (client) => {
    try {
      return await bulkInsert(
        'customers',
        columns,
        rows,
        ['email', 'phone_number'], // Conflict resolution based on email, phone
        ['firstname', 'lastname', 'address', 'status_id', 'updated_at'], // Update on conflict
        client
      );
    } catch (error) {
      logError('Bulk Insert Failed:', error);
      throw AppError.databaseError('Bulk insert operation failed', {
        details: { tableName: 'customers', columns, error: error.message },
      });
    }
  });
};

/**
 * Fetch paginated customer data with sorting and joining related tables.
 *
 * This function retrieves customers from the database with pagination, sorting, and optional filters.
 * It joins the `status` table to get the status name and the `users` table to retrieve the created_by and updated_by names.
 *
 * @param {number} [page=1] - The current page number for pagination.
 * @param {number} [limit=10] - The number of records to return per page.
 * @param {string} [sortBy='created_at'] - The field to sort the results by (allowed: firstname, lastname, email, created_at, updated_at).
 * @param {string} [sortOrder='DESC'] - Sorting order (ASC or DESC).
 * @returns {Promise<Object>} - Returns an object containing paginated customer data.
 * @throws {AppError} - Throws a database error if the query fails.
 */
const getAllCustomers = async (
  page = 1,
  limit = 10,
  sortBy = 'created_at',
  sortOrder = 'DESC'
) => {
  const tableName = 'customers c';
  const joins = [
    'INNER JOIN status s ON c.status_id = s.id',
    'LEFT JOIN users u1 ON c.created_by = u1.id',
    'LEFT JOIN users u2 ON c.updated_by = u2.id',
  ];
  const whereClause = '1=1';

  const allowedSortFields = [
    'firstname',
    'lastname',
    'email',
    'created_at',
    'updated_at',
  ];

  // Validate the sortBy field
  const validatedSortBy = allowedSortFields.includes(sortBy)
    ? `c.${sortBy}`
    : 'c.created_at';

  const baseQuery = `
      SELECT
        c.id,
        COALESCE(c.firstname || ' ' || c.lastname, 'Unknown') AS customer_name,
        c.email,
        c.phone_number,
        c.status_id,
        s.name AS status_name,
        c.created_at,
        c.updated_at,
        COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
        COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by
      FROM ${tableName}
      ${joins.join(' ')}
    `;

  try {
    return await retry(
      () =>
        paginateQuery({
          tableName,
          joins,
          whereClause,
          queryText: baseQuery,
          params: [],
          page,
          limit,
          sortBy: validatedSortBy,
          sortOrder,
        }),
      3 // Retry up to 3 times
    );
  } catch (error) {
    logError('Error fetching customers:', error);
    throw AppError.databaseError('Failed to fetch customers.');
  }
};

/**
 * Fetches customer data for a dropdown selection.
 *
 * This function retrieves customers from the database with a limit on the number of results.
 * If a search term is provided, it filters customers by their firstname, lastname, email, or phone number.
 *
 * @param {string} [search=""] - The search term to filter customers (matches firstname, lastname, email, or phone_number).
 * @param {number} [limit=100] - The maximum number of customers to return.
 * @returns {Promise<Array<{ id: string, label: string }>>} - A promise that resolves to an array of customer objects with `id` and `label`.
 * @throws {Error} - Throws an error if the database query fails.
 *
 * @example
 * // Fetch first 100 customers for dropdown
 * const customers = await getCustomersForDropdown(query);
 *
 * @example
 * // Fetch customers with search term "Alice"
 * const customers = await getCustomersForDropdown(query, "Alice");
 */
const getCustomersForDropdown = async (search = '', limit = 100) => {
  try {
    let whereClause = '1=1'; // Default matches all customers
    let params = [];
    let searchCondition = '';
    let labelFormat = "c.firstname || ' ' || c.lastname"; // Default label format

    if (search) {
      searchCondition = `LOWER(c.firstname) ILIKE LOWER($1)
                         OR LOWER(c.lastname) ILIKE LOWER($1)
                         OR LOWER(c.email) ILIKE LOWER($1)
                         OR c.phone_number ILIKE $1`;

      whereClause += ` AND (${searchCondition})`;
      params.push(`%${search}%`);

      // Adjust label format based on search type
      if (/\S+@\S+\.\S+/.test(search)) {
        // If search contains '@', assume email
        labelFormat = `c.firstname || ' ' || c.lastname || ' - ' || c.email`;
      } else if (/^\+?\d[\d -]{8,}\d$/.test(search)) {
        // If search looks like a phone number
        labelFormat = `c.firstname || ' ' || c.lastname || ' - ' || c.phone_number`;
      }
    }

    const sql = `
      SELECT
        c.id,
        ${labelFormat} AS label
      FROM customers c
      WHERE ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $2;
    `;

    params.push(limit); // Limit parameter

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    logError('Error fetching customers for dropdown:', error);
    throw AppError.databaseError('Failed to fetch customer dropdown data.');
  }
};

/**
 * Fetch customer details by ID from the database.
 * @param {string} customerId - The UUID of the customer.
 * @returns {Promise<Object>} - Returns the customer details if found.
 * @throws {AppError} - Throws an error if the customer is not found or if a database error occurs.
 */
const getCustomerById = async (customerId) => {
  try {
    const queryText = `
      SELECT
        c.id,
        COALESCE(c.firstname || ' ' || c.lastname, 'Unknown') AS customer_name,
        c.email,
        c.phone_number,
        c.address,
        c.note,
        c.status_id,
        s.name AS status_name,
        c.status_date,
        c.created_at,
        c.updated_at,
        COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
        COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by
      FROM customers c
      INNER JOIN status s ON c.status_id = s.id
      LEFT JOIN users u1 ON c.created_by = u1.id
      LEFT JOIN users u2 ON c.updated_by = u2.id
      WHERE c.id = $1
    `;

    const { rows } = await retry(() => query(queryText, [customerId]));

    if (rows.length === 0) {
      throw AppError.notFoundError('Customer not found', 404);
    }

    return rows[0];
  } catch (error) {
    logError('Error fetching customer by ID:', error);
    throw AppError.databaseError('Failed to fetch customer details.');
  }
};

module.exports = {
  checkCustomerExists,
  bulkCreateCustomers,
  getAllCustomers,
  getCustomersForDropdown,
  getCustomerById,
};

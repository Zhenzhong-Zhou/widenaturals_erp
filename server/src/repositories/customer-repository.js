const { bulkInsert, query, retry, paginateQuery } = require('../database/db');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Repository function to check if a customer exists by ID.
 * @param {string} customerId - The UUID of the customer.
 * @param {object} client - Optional database transaction client.
 * @returns {Promise<boolean>} - Returns true if the customer exists, otherwise false.
 */
const checkCustomerExistsById = async (customerId, client = null) => {
  try {
    const queryText = `SELECT EXISTS (SELECT 1 FROM customers WHERE id = $1) AS exists;`;
    const { rows } = await query(queryText, [customerId], client);
    return rows[0]?.exists || false;
  } catch (error) {
    logError('Error checking customer existence by ID:', error);
    throw AppError.databaseError('Failed to check customer existence by ID');
  }
};

/**
 * Repository function to check if a customer exists by email or phone number.
 * @param {string} email - Customer email.
 * @param {string} phone_number - Customer phone number.
 * @param {object} client - Optional database transaction client.
 * @returns {Promise<boolean>} - True if the customer exists, otherwise false.
 */
const checkCustomerExistsByEmailOrPhone = async (
  email,
  phone_number,
  client = null
) => {
  if (!email && !phone_number) return false;

  try {
    const sql = `
      SELECT EXISTS (
        SELECT 1 FROM customers WHERE email = $1 OR phone_number = $2
      ) AS exists;
    `;
    const { rows } = await query(
      sql,
      [email || null, phone_number || null],
      client
    );
    return rows[0]?.exists || false;
  } catch (error) {
    logError('Error checking customer existence by email or phone:', error);
    throw AppError.databaseError(
      'Failed to check customer existence by email or phone'
    );
  }
};

/**
 * Inserts multiple customers into the database in a transaction.
 * @param {Array} customers - List of customer objects.
 * @param client
 * @returns {Promise<Array>} - The inserted customers.
 */
const bulkCreateCustomers = async (customers, client) => {
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
    'address_line1',
    'address_line2',
    'city',
    'state',
    'postal_code',
    'country',
    'region',
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
    customer.address_line1,
    customer.address_line2 || null,
    customer.city,
    customer.state,
    customer.postal_code,
    customer.country,
    customer.region || null,
    customer.status_id,
    customer.note || null,
    new Date(), // status_date
    new Date(), // created_at
    null, // updated_at
    customer.created_by,
    null, // updated_by
  ]);

  try {
    return await bulkInsert(
      'customers',
      columns,
      rows,
      ['email', 'phone_number'], // Conflict resolution based on email, phone
      [
        'firstname',
        'lastname',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'postal_code',
        'country',
        'region',
        'status_id',
        'note',
        'updated_at',
        'updated_by',
      ], // Update on conflict
      client
    );
  } catch (error) {
    logError('Bulk Insert Failed:', error);
    throw AppError.databaseError('Bulk insert operation failed', {
      details: { tableName: 'customers', columns, error: error.message },
    });
  }
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
 * Fetches customer data for a dropdown selection, including optional shipping info.
 *
 * This function retrieves customers from the database with a limit on the number of results.
 * If a search term is provided, it filters customers by their firstname, lastname, email, or phone number.
 * Returns customer id, label (name + contact), and shipping address fields for auto-filling.
 *
 * @param {string} [search=""] - The search term to filter customers (matches firstname, lastname, email, or phone_number).
 * @param {number} [limit=100] - The maximum number of customers to return.
 * @returns {Promise<Array<{
 *   id: string,
 *   fullname: string | null,
 *   label: string,
 *   phone: string | null,
 *   email: string | null,
 *   address: string | null,
 *   address_line2: string | null,
 *   city: string | null,
 *   state: string | null,
 *   postal_code: string | null,
 *   country: string | null,
 *   region: string | null
 * }>>} - A promise resolving to customer dropdown entries with shipping details.
 *
 * @throws {Error} - Throws an error if the database query fails.
 *
 * @example
 * // Fetch default customer list
 * const customers = await getCustomersForDropdown();
 *
 * @example
 * // Fetch with search filter
 * const customers = await getCustomersForDropdown("Alice");
 */
const getCustomersForDropdown = async (search = '', limit = 100) => {
  try {
    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = `WHERE LOWER(c.firstname) ILIKE LOWER($1)
                     OR LOWER(c.lastname) ILIKE LOWER($1)
                     OR LOWER(c.email) ILIKE LOWER($1)
                     OR c.phone_number ILIKE $1`;
      params.push(`%${search}%`);
    }

    // Ensure proper query structure (avoid unnecessary WHERE when search is empty)
    // Use `COALESCE` to prioritize email, fallback to phone if email is null
    const sql = `
      SELECT
        c.id,
        c.firstname || ' ' || c.lastname ||
        CASE
          WHEN c.email IS NOT NULL THEN ' - ' || c.email
          WHEN c.phone_number IS NOT NULL THEN ' - ' || c.phone_number
          ELSE ''
        END AS label,
        c.address_line1,
        c.address_line2,
        c.city,
        c.state,
        c.postal_code,
        c.country,
        c.region
      FROM customers c
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${params.length + 1};
    `;

    params.push(limit); // Ensure proper parameter binding

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
const getCustomerDetailsById = async (customerId) => {
  try {
    const queryText = `
      SELECT
        c.id,
        COALESCE(c.firstname || ' ' || c.lastname, 'Unknown') AS customer_name,
        c.email,
        c.phone_number,
        c.address_line1,
        c.address_line2,
        c.city,
        c.state,
        c.postal_code,
        c.country,
        c.region,
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
  checkCustomerExistsById,
  checkCustomerExistsByEmailOrPhone,
  bulkCreateCustomers,
  getAllCustomers,
  getCustomersForDropdown,
  getCustomerDetailsById,
};

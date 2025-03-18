const { query, retry, paginateQuery } = require('../database/db');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper'); // Import the reusable query function

/**
 * Fetches an order type by ID or Name.
 * @param {Object} params - The parameters (id or name).
 * @param {string} [params.id] - The UUID of the order type.
 * @param {string} [params.name] - The name of the order type.
 * @returns {Promise<Object|null>} - Returns the order type object or null if not found.
 */
const getOrderTypeByIdOrName = async ({ id, name }) => {
  let sql;
  let values;

  if (id) {
    sql = `SELECT * FROM order_types WHERE id = $1 LIMIT 1;`;
    values = [id];
  } else if (name) {
    sql = `SELECT * FROM order_types WHERE name = $1 LIMIT 1;`;
    values = [name];
  } else {
    throw AppError.databaseError(
      'Either "id" or "name" must be provided to fetch an order type.'
    );
  }

  const result = await query(sql, values);
  return result.rows[0] || null;
};

/**
 * Fetch all order types from the database using raw SQL.
 * @returns {Promise<Array>} List of order types.
 */
const getAllOrderTypes = async (
  page = 1,
  limit = 10,
  sortBy = 'name',
  sortOrder = 'ASC'
) => {
  const tableName = 'order_types ot';
  const joins = [
    'INNER JOIN status s ON ot.status_id = s.id',
    'LEFT JOIN users u1 ON ot.created_by = u1.id',
    'LEFT JOIN users u2 ON ot.updated_by = u2.id',
  ];
  const whereClause = '1=1';

  const allowedSortFields = [
    'name',
    'category',
    'status_name',
    'created_at',
    'updated_at',
  ];

  // Validate the sortBy field
  const validatedSortBy = allowedSortFields.includes(sortBy)
    ? `ot.${sortBy}`
    : 'ot.name';

  const baseQuery = `
      SELECT
        ot.id,
        ot.name,
        ot.category,
        ot.description,
        s.name AS status_name,
        ot.status_date,
        ot.created_at,
        ot.updated_at,
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
    logError('Error fetching order types:', error);
    throw AppError.databaseError('Failed to fetch order types');
  }
};

const getOrderTypes = async (type = 'lookup') => {
  try {
    const columns =
      type === 'dropdown'
        ? 'ot.id, ot.name'
        : 'ot.id, ot.name, ot.description, ot.category';

    const queryText = `
      SELECT ${columns}
      FROM order_types ot
      JOIN status s ON ot.status_id = s.id
      WHERE s.name = 'active';
    `;

    const { rows } = await query(queryText);

    return rows;
  } catch (error) {
    logError('Error fetching order types:', error);
    throw AppError.databaseError('Failed to fetch order types');
  }
};

/**
 * Repository function to check if an order type exists by ID.
 * @param {string} orderTypeId - The UUID of the order type.
 * @param {object} client - Database transaction client (optional for transactions).
 * @returns {Promise<boolean>} - Returns true if the order type exists, otherwise false.
 */
const checkOrderTypeExists = async (orderTypeId, client = null) => {
  try {
    const queryText = `SELECT EXISTS (SELECT 1 FROM order_types WHERE id = $1) AS exists;`;
    const { rows } = await query(queryText, [orderTypeId], client);
    return rows[0]?.exists || false;
  } catch (error) {
    logError('Error checking order type existence:', error);
    throw AppError.databaseError('Failed to check order type existence');
  }
};

module.exports = {
  getOrderTypeByIdOrName,
  getAllOrderTypes,
  getOrderTypes,
  checkOrderTypeExists,
};

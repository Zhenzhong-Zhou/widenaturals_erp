const {
  buildOrderTypeFilter,
} = require('../utils/sql/build-order-type-filters');
const {
  paginateQuery,
  query,
  getFieldValuesByField,
} = require('../database/db');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Fetches paginated and optionally filtered list of order types from the database.
 *
 * Executes a raw SQL query with dynamic WHERE clause, sorting, and pagination support.
 * Join `status`, `users` (created_by / updated_by) for enriched display data.
 *
 * @param {Object} options - Query options.
 * @param {number} [options.page=1] - Page number (1-based).
 * @param {number} [options.limit=10] - Number of records per page.
 * @param {string} [options.sortBy='name'] - Column to sort by (e.g., 'name', 'created_at').
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC'] - Sorting direction.
 * @param {Object} [options.filters={}] - Filtering criteria (category, keyword, status, etc.).
 *
 * @returns {Promise<{ data: Array, pagination: Object }>} A promise resolving to paginated order types with metadata.
 *
 * @throws {AppError} Throws if the query fails or pagination fails.
 *
 * @example
 * const result = await getPaginatedOrderTypes({
 *   page: 2,
 *   limit: 20,
 *   sortBy: 'created_at',
 *   sortOrder: 'DESC',
 *   filters: {
 *     category: 'sales',
 *     keyword: 'return',
 *     requiresPayment: true,
 *   }
 * });
 */
const getPaginatedOrderTypes = async ({
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'name',
  sortOrder = 'ASC',
}) => {
  const { whereClause, params } = buildOrderTypeFilter(filters);

  const tableName = 'order_types ot';

  const joins = [
    'INNER JOIN status s ON ot.status_id = s.id',
    'LEFT JOIN users u1 ON ot.created_by = u1.id',
    'LEFT JOIN users u2 ON ot.updated_by = u2.id',
  ];

  const baseQuery = `
    SELECT
      ot.id,
      ot.name,
      ot.code,
      ot.category,
      ot.requires_payment,
      ot.status_id,
      s.name AS status_name,
      ot.status_date,
      ot.created_at,
      ot.updated_at,
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

    logSystemInfo('Fetched order types successfully', {
      context: 'order-type-repository/getPaginatedOrderTypes',
      resultCount: result?.data?.length,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });

    return result;
  } catch (error) {
    logSystemException(
      error,
      'Failed to fetch paginated order types from database',
      {
        context: 'order-type-repository/getPaginatedOrderTypes',
        filters,
        pagination: { page, limit },
        sorting: { sortBy, sortOrder },
      }
    );

    throw AppError.databaseError(
      'Unable to retrieve order types. Please try again later.'
    );
  }
};

/**
 * Fetches a list of order types for lookup purposes.
 *
 * This function is optimized for small datasets (<100 rows) and is typically used
 * in dropdowns, filters, and selection UIs. It optionally applies filter conditions.
 *
 * @param {Object} [options] - Optional parameters
 * @param {Object} [options.filters] - Optional filters to narrow results (e.g., statusId, category)
 * @returns {Promise<Array>} Resolves to an array of order type objects (id, name, category, code, status_id)
 * @throws {AppError} Throws if a database query fails
 */
const getOrderTypeLookup = async ({ filters = {} } = {}) => {
  const { whereClause, params } = buildOrderTypeFilter(filters);

  const queryText = `
    SELECT
      id,
      name,
      category,
      requires_payment,
      status_id
    FROM order_types ot
    WHERE ${whereClause}
    ORDER BY name ASC
  `;

  try {
    const { rows } = await query(queryText, params);

    logSystemInfo('Fetched order type lookup', {
      context: 'order-type-repository/getOrderTypeLookup',
      filters,
    });

    return rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch order type lookup', {
      context: 'order-type-repository/getOrderTypeLookup',
      filters,
    });
    throw AppError.databaseError('Failed to fetch order type lookup');
  }
};

/**
 * Retrieves the IDs of all order types that belong to a specific category.
 *
 * This is typically used for access control and filtering orders by category.
 * For example, in a sales dashboard, you may only want to fetch orders whose
 * `order_type_id` matches a set of types within the "sales" category.
 *
 * Internally, this delegates to `getFieldValuesByField`, selecting all `id` values
 * from the `order_types` table where `category` equals the provided value.
 *
 * @async
 * @param {string} category - The category to filter order types by (e.g., `'sales'`, `'purchase'`, `'logistics'`).
 * @param {import('pg').PoolClient} [client=null] - Optional PostgreSQL client to use within a transaction or query chain.
 * @returns {Promise<string[]>} - A list of UUIDs representing the order type IDs in the given category.
 *
 * @throws {AppError} - Throws an AppError if:
 *   - The `category` is invalid or not provided
 *   - The database query fails (wrapped from `getFieldValuesByField`)
 *
 * @example
 * const salesTypeIds = await getOrderTypeIdsByCategory('sales');
 * const orders = await getOrders({ orderTypeId: salesTypeIds });
 */
const getOrderTypeIdsByCategory = async (category, client = null) => {
  return await getFieldValuesByField(
    'order_types', // table name
    'category', // filter field
    category, // filter value
    'id', // field to return
    client // optional transaction context
  );
};

/**
 * Fetches the order type metadata (code, name, category, number) for a given order ID.
 *
 * Business rule:
 *  - Orders are linked to an order type that defines their category (e.g. sales, purchase, transfer).
 *  - This metadata is required to determine downstream logic such as fulfillment and shipment rules.
 *
 * Usage:
 *  - Call at the service layer before performing operations that depend on order type.
 *  - Intended as a read-only repository helper.
 *
 * @async
 * @function
 * @param {string} orderId - UUID of the order
 * @param {import('pg').PoolClient|null} [client=null] - Optional PostgreSQL client or transaction
 * @returns {Promise<{
 *   order_id: string,
 *   order_number: string,
 *   order_type_code: string,
 *   order_type_name: string,
 *   order_type_category: string
 * } | null>} The order type metadata, or null if the order is not found
 *
 * @throws {AppError} DatabaseError if the query fails
 *
 * @example
 * const orderTypeMeta = await getOrderTypeMetaByOrderId('uuid-123');
 * // {
 * //   order_id: "uuid-123",
 * //   order_number: "SO-2025-0001",
 * //   order_type_code: "SALES",
 * //   order_type_name: "Sales Order",
 * //   order_type_category: "sales"
 * // }
 */
const getOrderTypeMetaByOrderId = async (orderId, client = null) => {
  const sql = `
    SELECT
      o.id AS order_id,
      o.order_number,
      ot.code AS order_type_code,
      ot.name AS order_type_name,
      ot.category AS order_type_category
    FROM orders o
    JOIN order_types ot ON o.order_type_id = ot.id
    WHERE o.id = $1;
  `;

  try {
    const { rows } = await query(sql, [orderId], client);

    logSystemInfo('Fetched order type metadata', {
      context: 'order-type-repository/getOrderTypeMetaByOrderId',
      orderId,
      rowCount: rows.length,
    });

    return rows[0] ?? null;
  } catch (error) {
    logSystemException(error, 'Failed to fetch order type metadata', {
      context: 'order-type-repository/getOrderTypeMetaByOrderId',
      orderId,
    });

    throw AppError.databaseError(
      'Database query failed while fetching order type metadata',
      {
        cause: error,
        orderId,
      }
    );
  }
};

module.exports = {
  getPaginatedOrderTypes,
  getOrderTypeLookup,
  getOrderTypeIdsByCategory,
  getOrderTypeMetaByOrderId,
};

const { query, paginateQuery, retry } = require('../database/db');

/**
 * Build WHERE clause dynamically based on filters.
 * @param {Object} filters - Filters like category, name, etc.
 * @returns {Object} - { whereClause: string, queryParams: array }
 */
const buildWhereClause = (filters) => {
  const whereClauses = [];
  const queryParams = [];
  
  if (filters.category) {
    whereClauses.push('category = $' + (queryParams.length + 1));
    queryParams.push(filters.category);
  }
  
  if (filters.name) {
    whereClauses.push('product_name ILIKE $' + (queryParams.length + 1)); // Case-insensitive
    queryParams.push(`%${filters.name}%`);
  }
  
  return {
    whereClause: whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '',
    queryParams,
  };
};

/**
 * Fetch products with pagination and optional filters, using retry and pagination logic.
 * @param {Object} options - { page, limit, filters, sortBy, sortOrder }
 * @returns {Promise<Object>} - { data, pagination }
 */
const getProducts = async ({ page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' }) => {
  const tableName = 'products p';
  const joins = ['LEFT JOIN status s ON p.status_id = s.id'];
  const whereClause = "s.name = 'active'";
  
  // Base query text for fetching products
  const queryText = `
    SELECT
      p.id,
      p.product_name,
      p.series,
      p.brand,
      p.category,
      p.barcode,
      p.market_region,
      p.length_cm,
      p.width_cm,
      p.height_cm,
      p.weight_g,
      p.description,
      p.status_id,
      p.status_date,
      p.created_at,
      p.updated_at
    FROM products p
    INNER JOIN status s ON p.status_id = s.id
    WHERE s.name = 'active'
  `;
  
  // Pagination logic using retry
  const fetchPaginatedData = async () =>
    paginateQuery({
      tableName,
      joins,
      whereClause,
      queryText,
      params: [],
      page,
      limit,
      sortBy,
      sortOrder,
    });
  
  // Execute the function with retries
  return await retry(fetchPaginatedData, 3, 1000);
};

/**
 * Checks if a product exists in the database based on provided filters.
 *
 * This function dynamically constructs a SQL query to check for the existence
 * of a product by combining the provided filters (`id`, `barcode`, `product_name`)
 * with the specified logical operator (`combineWith`).
 *
 * @param {Object} filters - The conditions to check for product existence.
 *                           Can include one or more of the following properties:
 *                           - `id` {string}: The unique identifier of the product.
 *                           - `barcode` {string}: The barcode of the product.
 *                           - `product_name` {string}: The name of the product.
 * @param {string} [combineWith='OR'] - Logical operator to combine the filters.
 *                                      - 'OR' (default): Checks if any condition is true.
 *                                      - 'AND': Checks if all conditions are true.
 * @returns {Promise<boolean>} - Resolves to `true` if a product matching the filters exists,
 *                               otherwise `false`.
 *
 * @throws {Error} - If no filters are provided or if there is an issue with the query execution.
 *
 * @example
 * // Check if a product exists with id or barcode
 * const exists = await checkProductExists({ id: '123', barcode: 'ABC123' });
 * console.log(exists); // true or false
 *
 * @example
 * // Check if a product exists with both id and barcode
 * const exists = await checkProductExists({ id: '123', barcode: 'ABC123' }, 'AND');
 * console.log(exists); // true or false
 */
const checkProductExists = async (filters, combineWith = 'OR') => {
  const whereClauses = [];
  const queryParams = [];
  
  if (filters.id) {
    whereClauses.push('id = $' + (queryParams.length + 1));
    queryParams.push(filters.id);
  }
  
  if (filters.barcode) {
    whereClauses.push('barcode = $' + (queryParams.length + 1));
    queryParams.push(filters.barcode);
  }
  
  if (filters.product_name) {
    whereClauses.push('product_name = $' + (queryParams.length + 1));
    queryParams.push(filters.product_name);
  }
  
  if (whereClauses.length === 0) {
    throw new Error('No filters provided for product existence check.');
  }
  
  // Use AND or OR based on the combineWith parameter
  const operator = combineWith.toUpperCase() === 'AND' ? ' AND ' : ' OR ';
  const whereClause = `WHERE ${whereClauses.join(operator)}`;
  
  const queryText = `
    SELECT EXISTS (
      SELECT 1
      FROM products
      ${whereClause}
    ) AS exists;
  `;
  
  const result = await query(queryText, queryParams);
  return result.rows[0].exists;
};

module.exports = {
  getProducts,
  checkProductExists,
};

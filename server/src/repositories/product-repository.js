const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

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
 * Fetch paginated products with filtering and sorting.
 * @param {Object} options - Options for query building.
 * @param {number} options.page - Current page number.
 * @param {number} options.limit - Number of items per page.
 * @param {string} options.sortBy - Column to sort by.
 * @param {string} options.sortOrder - Sort direction (ASC/DESC).
 * @param {string} [options.status='active'] - Filter products by status.
 * @returns {Promise<Object>} - Paginated product data.
 */
const getProducts = async ({
                             page = 1,
                             limit = 10,
                             sortBy = 'p.created_at',
                             sortOrder = 'DESC',
                             status = 'active',
                           }) => {
  const tableName = 'products p';
  const joins = ['INNER JOIN status s ON p.status_id = s.id'];
  const whereClause = 's.name = $1'; // Use parameterized value
  
  // Base query text
  const queryText = `
    SELECT
      p.id,
      p.product_name,
      p.series,
      p.brand,
      p.category,
      p.barcode,
      p.market_region,
      s.name AS status_name,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'pricing_type', pricing.pricing_type,
            'price', pricing.price
          )
        ) FILTER (WHERE pricing.pricing_type IN ('Retail', 'MSRP')), '[]'
      ) AS prices
    FROM ${tableName}
    INNER JOIN status s ON p.status_id = s.id
    LEFT JOIN (
      SELECT pr.product_id, pt.name AS pricing_type, pr.price
        FROM pricing pr
        INNER JOIN pricing_types pt ON pr.price_type_id = pt.id
        INNER JOIN status ps ON pr.status_id = ps.id
        WHERE ps.name = 'active'
    ) pricing ON pricing.product_id = p.id
    WHERE ${whereClause}
    GROUP BY p.id, s.name
  `;
  
  const fetchPaginatedData = async () => {
    logInfo('Fetching paginated products', { page, limit, sortBy, sortOrder, status });
    return paginateQuery({
      tableName,
      joins,
      whereClause,
      queryText,
      params: [status], // Parameterize the status filter
      page,
      limit,
      sortBy,
      sortOrder,
    });
  };
  
  try {
    return await retry(fetchPaginatedData, 3, 1000);
  } catch (error) {
    logError('Error fetching paginated products', {
      message: error.message,
      stack: error.stack,
    });
    throw new AppError.serviceError('Failed to fetch products', { originalError: error.message });
  }
};

/**
 * Checks if a product exists in the database based on provided filters.
 *
 * Dynamically constructs a SQL query to check for the existence of a product
 * by combining the provided filters (`id`, `barcode`, `product_name`) with the
 * specified logical operator (`combineWith`).
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
 * @throws {AppError} - If no filters are provided or if there is an issue with the query execution.
 */
const checkProductExists = async (filters, combineWith = 'OR') => {
  if (!filters || typeof filters !== 'object' || Object.keys(filters).length === 0) {
    throw new AppError.validationError(
      'No valid filters provided for product existence check.',
      400,
      { providedFilters: filters }
    );
  }
  
  const allowedFilters = ['id', 'barcode', 'product_name'];
  const whereClauses = [];
  const queryParams = [];
  
  // Build WHERE clause dynamically
  Object.entries(filters).forEach(([key, value]) => {
    if (allowedFilters.includes(key) && value) {
      whereClauses.push(`${key} = $${queryParams.length + 1}`);
      queryParams.push(value);
    }
  });
  
  if (whereClauses.length === 0) {
    throw new AppError.validationError(
      'No valid filters provided for product existence check.',
      400,
      { providedFilters: filters }
    );
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
  
  try {
    const result = await query(queryText, queryParams);
    return result.rows[0].exists;
  } catch (error) {
    throw new AppError.databaseError('Failed to execute product existence check.', {
      query: queryText,
      params: queryParams,
      originalError: error.message,
    });
  }
};

/**
 * Fetch product details by ID from the database.
 * Retrieves product information, including retail and MSRP prices,
 * only if the product is active.
 *
 * @param {string} id - The ID of the product to fetch
 * @returns {Promise<object>} - Returns an object containing product details
 * @throws {AppError} - Throws not found or database error
 */
const getProductDetailsById = async (id) => {
  const queryText = `
    SELECT
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
      s.name AS status_name,
      pr.price AS retail_price,
      pm.price AS msrp_price,
      p.created_at,
      p.updated_at
    FROM products p
    INNER JOIN status s ON p.status_id = s.id
    LEFT JOIN (
      SELECT pr.product_id, pr.price
      FROM pricing pr
      INNER JOIN pricing_types pt ON pr.price_type_id = pt.id
      WHERE pt.name = 'Retail'
    ) pr ON p.id = pr.product_id
    LEFT JOIN (
      SELECT pm.product_id, pm.price
      FROM pricing pm
      INNER JOIN pricing_types pt ON pm.price_type_id = pt.id
      WHERE pt.name = 'MSRP'
    ) pm ON p.id = pm.product_id
    WHERE p.id = $1 AND s.name = 'active';
  `;
  
  try {
    // Use retry logic to handle transient database issues
    const fetchProduct = async () => {
      const result = await query(queryText, [id]);
      if (result.rows.length === 0) {
        throw AppError.notFoundError('Product not found or inactive');
      }
      return result.rows[0]; // Return the product details
    };
    
    return await retry(fetchProduct, 3, 1000); // Retry 3 times with a 1-second delay
  } catch (error) {
    logError('Error fetching product details:', error.message);
    throw new AppError.databaseError('Error fetching product details');
  }
};

module.exports = {
  getProducts,
  checkProductExists,
  getProductDetailsById
};

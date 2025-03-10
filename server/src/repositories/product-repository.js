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
    whereClause: whereClauses.length
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '',
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
      SELECT
        pr.product_id,
        pt.name AS pricing_type,
        pr.price,
        pr.location_id
      FROM pricing pr
      INNER JOIN pricing_types pt ON pr.price_type_id = pt.id
      INNER JOIN status ps ON pr.status_id = ps.id
      INNER JOIN locations l ON pr.location_id = l.id
      INNER JOIN location_types lt ON l.location_type_id = lt.id
      WHERE ps.name = 'active'
        AND lt.name = 'Office'
        AND pt.name IN ('Retail', 'MSRP')
    ) pricing ON pricing.product_id = p.id
    LEFT JOIN locations loc ON pricing.location_id = loc.id
    LEFT JOIN location_types lt ON loc.location_type_id = lt.id
    WHERE ${whereClause}
    GROUP BY p.id, s.name, loc.name, lt.name
  `;

  const fetchPaginatedData = async () => {
    logInfo('Fetching paginated products', {
      page,
      limit,
      sortBy,
      sortOrder,
      status,
    });
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
    throw new AppError.serviceError('Failed to fetch products', {
      originalError: error.message,
    });
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
  if (
    !filters ||
    typeof filters !== 'object' ||
    Object.keys(filters).length === 0
  ) {
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
    throw new AppError.databaseError(
      'Failed to execute product existence check.',
      {
        query: queryText,
        params: queryParams,
        originalError: error.message,
      }
    );
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
      loc.name AS location_name,
      lt.name AS location_type_name,
      s.name AS status_name,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'pricing_type', pricing.pricing_type,
            'price', pricing.price
          )
        ) FILTER (WHERE pricing.pricing_type IN ('Retail', 'MSRP')), '[]'
      ) AS prices,
      p.status_date,
      CONCAT(COALESCE(created_user.firstname, ''), ' ', COALESCE(created_user.lastname, '')) AS created_by_fullname,
      p.created_at,
      CONCAT(COALESCE(updated_user.firstname, ''), ' ', COALESCE(updated_user.lastname, '')) AS updated_by_fullname,
      p.updated_at
    FROM products p
    INNER JOIN status s ON p.status_id = s.id
    LEFT JOIN (
      SELECT
        pr.product_id,
        pt.name AS pricing_type,
        pr.price,
        pr.location_id
      FROM pricing pr
      INNER JOIN pricing_types pt ON pr.price_type_id = pt.id
      INNER JOIN status ps ON pr.status_id = ps.id
      INNER JOIN locations loc ON pr.location_id = loc.id
      INNER JOIN location_types lt ON loc.location_type_id = lt.id
      WHERE ps.name = 'active'
        AND lt.name = 'Office'
        AND pt.name IN ('Retail', 'MSRP')
    ) pricing ON pricing.product_id = p.id
    LEFT JOIN locations loc ON pricing.location_id = loc.id
    LEFT JOIN location_types lt ON loc.location_type_id = lt.id
    LEFT JOIN users created_user ON p.created_by = created_user.id
    LEFT JOIN users updated_user ON p.updated_by = updated_user.id
    WHERE p.id = $1
      AND s.name = 'active'
    GROUP BY
      p.id,
      s.name,
      p.status_date,
      loc.name,
      lt.name,
      created_user.firstname,
      created_user.lastname,
      p.created_at,
      updated_user.firstname,
      updated_user.lastname,
      p.updated_at
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

/**
 * Retrieves a list of available products for a dropdown selection, filtering out those already associated with the given warehouse.
 *
 * @param {string} warehouseId - The unique identifier of the warehouse.
 * @returns {Promise<Array<{ id: string, product_name: string }>>}
 *          - Returns an array of available products with their IDs and names, sorted alphabetically.
 * @throws {AppError} - Throws an error if the database query fails.
 */
const getAvailableProductsForDropdown = async (warehouseId) => {
  if (!warehouseId) {
    return []; // Return an empty array instead of running the query
  }

  const queryText = `
    WITH active_warehouses AS (
        SELECT DISTINCT wi.warehouse_id
        FROM warehouse_inventory wi
        JOIN warehouse_lot_status wls ON wi.status_id = wls.id
        WHERE wls.name = 'active'
          AND wi.warehouse_id = $1
    ),
    existing_active_products AS (
        SELECT DISTINCT i.product_id
        FROM inventory i
        JOIN warehouse_inventory wi ON wi.inventory_id = i.id
        JOIN active_warehouses aw ON aw.warehouse_id = wi.warehouse_id
    ),
    valid_batch_products AS (
        SELECT DISTINCT ON (i.product_id) i.product_id
        FROM warehouse_inventory_lots wil
        JOIN inventory i ON wil.inventory_id = i.id
        WHERE wil.lot_number IS NOT NULL
          AND wil.expiry_date IS NOT NULL
          AND (wil.manufacture_date IS NOT NULL OR wil.manufacture_date IS NULL)
          AND wil.warehouse_id = $1
    ),
    active_products AS (
        SELECT p.id AS product_id
        FROM products p
        JOIN status s ON s.id = p.status_id
        WHERE s.name = 'active'
    )
    SELECT p.id AS product_id, p.product_name
    FROM products p
    LEFT JOIN existing_active_products eap ON eap.product_id = p.id
    LEFT JOIN valid_batch_products vbp ON vbp.product_id = p.id
    JOIN active_products ap ON ap.product_id = p.id
    WHERE eap.product_id IS NULL
    ORDER BY p.product_name ASC;
  `;

  try {
    const { rows } = await query(queryText, [warehouseId]);
    return rows;
  } catch (error) {
    logError('Error fetching available products for dropdown', {
      message: error.message,
      stack: error.stack,
    });
    throw new AppError.databaseError(
      'Failed to fetch available product dropdown list',
      {
        originalError: error.message,
      }
    );
  }
};

module.exports = {
  getProducts,
  checkProductExists,
  getProductDetailsById,
  getAvailableProductsForDropdown,
};

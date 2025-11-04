const { query, paginateResults } = require('../database/db');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const { buildProductFilter } = require('../utils/sql/build-product-filters');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');

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
    throw AppError.validationError(
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
    throw AppError.validationError(
      'No valid filters provided for product existence check.',
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
    throw AppError.databaseError('Failed to execute product existence check.', {
      query: queryText,
      params: queryParams,
      originalError: error.message,
    });
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
    throw AppError.databaseError(
      'Failed to fetch available product dropdown list',
      {
        originalError: error.message,
      }
    );
  }
};

/**
 * Fetches active products for a dropdown.
 * Filters by:
 * - `status_id` matches the 'active' status from the `status` table.
 * - Optionally filtered by search term (product name or SKU).
 *
 * @param {string|null} search - Optional search term for filtering (by name, SKU, etc.)
 * @param {number} limit - Maximum number of results to fetch (Default: 100).
 * @returns {Promise<Array<{ id: string, label: string }>>}
 */
const getProductsForDropdown = async (search = null, limit = 100) => {
  try {
    const searchPattern = search ? `%${search}%` : null;

    const queryText = `
      SELECT
          p.id,
          CONCAT(p.product_name, ' (', p.barcode, ')') AS label
      FROM products p
      JOIN status s ON p.status_id = s.id
      WHERE s.name = 'active'
      ${searchPattern ? `AND (p.product_name ILIKE $1 OR p.sku ILIKE $1 OR p.barcode ILIKE $1)` : ''}
      ORDER BY p.product_name ASC
      LIMIT ${searchPattern ? '$2' : '$1'};
    `;

    const values = searchPattern ? [searchPattern, limit] : [limit];
    const { rows } = await query(queryText, values);

    return rows;
  } catch (error) {
    logError('Error fetching products for dropdown:', error);
    throw AppError.databaseError('Failed to fetch products for dropdown');
  }
};

/**
 * Retrieves a paginated list of products with linked status and user metadata.
 *
 * This repository function builds a parameterized SQL query using the
 * `buildProductFilter` utility to safely construct WHERE clauses from structured
 * filter input. It supports pagination, dynamic sorting, and fuzzy keyword search,
 * returning consistent query results across services and dashboards.
 *
 * ### Features
 * - Secure, parameterized filtering via `buildProductFilter`
 * - Joins to `status` for readable status names
 * - Built-in pagination and structured logging
 *
 * ### Example
 * ```js
 * const result = await getPaginatedProducts({
 *   filters: { keyword: 'Immune', brand: 'Canaherb' },
 *   page: 2,
 *   limit: 20,
 *   sortBy: 'created_at',
 *   sortOrder: 'DESC'
 * });
 * ```
 *
 * ### Returns
 * ```js
 * {
 *   data: [ { id, name, brand, status_name, ... } ],
 *   pagination: { total, totalPages, page, limit }
 * }
 * ```
 *
 * @async
 * @function
 * @param {Object} options - Query configuration
 * @param {Object} [options.filters={}] - Structured filter criteria (see `buildProductFilter`)
 * @param {number} [options.page=1] - Current page number (1-indexed)
 * @param {number} [options.limit=10] - Records per page
 * @param {string} [options.sortBy='created_at'] - Column to sort by (validated internally)
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC'] - Sort direction
 *
 * @returns {Promise<{
 *   data: any[];
 *   pagination: {
 *     page: number;
 *     limit: number;
 *     totalRecords: number;
 *     totalPages: number;
 *   };
 * }>} Paginated products results
 * Returns a paginated dataset or `null` if no records are found.
 *
 * @throws {AppError} If query execution or pagination fails.
 */
const getPaginatedProducts = async ({
                                      filters = {},
                                      page = 1,
                                      limit = 10,
                                      sortBy = 'created_at',
                                      sortOrder = 'DESC',
                                    }) => {
  const { whereClause, params } = buildProductFilter(filters);
  
  const queryText = `
    SELECT
      p.id,
      p.name,
      p.brand,
      p.category,
      p.series,
      s.name AS status_name,
      p.status_id,
      p.status_date,
      p.created_at,
      p.updated_at
    FROM products AS p
    LEFT JOIN status AS s ON p.status_id = s.id
    WHERE ${whereClause}
    ORDER BY ${sortBy} ${sortOrder};
  `;
  
  try {
    const result = await paginateResults({
      dataQuery: queryText,
      params,
      page,
      limit,
      meta: {
        context: 'product-repository/getPaginatedProducts',
      },
    });
    
    if (result.data.length === 0) {
      logSystemInfo('No products found for current query', {
        context: 'product-repository/getPaginatedProducts',
        filters,
        pagination: { page, limit },
        sorting: { sortBy, sortOrder },
      });
      return null;
    }
    
    logSystemInfo('Fetched paginated product records successfully', {
      context: 'product-repository/getPaginatedProducts',
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch paginated product records', {
      context: 'product-repository/getPaginatedProducts',
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    throw AppError.databaseError('Failed to fetch paginated product records', {
      context: 'product-repository/getPaginatedProducts',
      details: error.message,
    });
  }
};

/**
 * Repository: Get Product Details by ID
 *
 * Fetches a single product record, including its status metadata and audit trail information.
 * Designed for product detail views or edit pages where full context is required.
 *
 * ### Behavior
 * - Uses parameterized SQL for injection safety.
 * - Performs LEFT JOINs to include status and user metadata.
 * - Returns a single row or `null` if no record exists.
 * - Logs structured info and exception details for observability.
 *
 * ### Performance
 * - Leverages indexed lookup on `products.id` (primary key).
 * - Uses minimal joins and columns for efficient data retrieval.
 *
 * @param {string} productId - UUID of the product to fetch.
 * @returns {Promise<object|null>} Full product record with status and audit info, or `null` if not found.
 *
 * @example
 * const row = await getProductDetailsById('8d5b7e4f-9231-4b0f-83d1-6c8e3b03b8f2');
 * if (row) console.log('Product:', row.name);
 */
const getProductDetailsById = async (productId) => {
  const queryText = `
    SELECT
      p.id,
      p.name,
      p.series,
      p.brand,
      p.category,
      p.description,
      s.id AS status_id,
      s.name AS status_name,
      p.status_date,
      p.created_at,
      p.updated_at,
      p.created_by,
      cb.firstname AS created_by_firstname,
      cb.lastname AS created_by_lastname,
      p.updated_by,
      ub.firstname AS updated_by_firstname,
      ub.lastname AS updated_by_lastname
    FROM products AS p
    LEFT JOIN status AS s ON p.status_id = s.id
    LEFT JOIN users AS cb ON p.created_by = cb.id
    LEFT JOIN users AS ub ON p.updated_by = ub.id
    WHERE p.id = $1
  `;
  
  try {
    const { rows } = await query(queryText, [productId]);
    
    if (rows.length === 0) {
      logSystemInfo('No product found for given ID', {
        context: 'product-repository/getProductDetailsById',
        productId,
      });
      return null;
    }
    
    logSystemInfo('Fetched product detail successfully', {
      context: 'product-repository/getProductDetailsById',
      productId,
    });
    
    return rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to fetch product detail', {
      context: 'product-repository/getProductDetailsById',
      productId,
      error: error.message,
    });
    
    throw AppError.databaseError('Failed to fetch product detail', {
      context: 'product-repository/getProductDetailsById',
      details: error.message,
    });
  }
};

module.exports = {
  checkProductExists,
  getAvailableProductsForDropdown,
  getProductsForDropdown,
  getPaginatedProducts,
  getProductDetailsById,
};

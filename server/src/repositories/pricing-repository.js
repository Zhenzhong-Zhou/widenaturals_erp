const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const { logError } = require('../utils/logger-helper');
const { buildPricingFilters } = require('../utils/sql/build-pricing-filters');

/**
 * Fetches a paginated list of pricing records with enriched SKU and product data.
 *
 * Supports optional sorting, keyword search, and filtering by fields like brand or pricing type.
 *
 * @param {Object} options - Options for pagination, sorting, and filtering.
 * @param {number} options.page - Current page number (1-based index).
 * @param {number} options.limit - Number of records per page.
 * @param {string} [options.sortBy='brand'] - Field to sort by (e.g., 'productName', 'price').
 * @param {string} [options.sortOrder='ASC'] - Sort direction: 'ASC' or 'DESC'.
 * @param {Object} [options.filters] - Optional filters (e.g., { brand: 'X', pricingType: 'MSRP' }).
 * @param {string} [options.keyword] - Optional keyword for fuzzy search across product name or SKU.
 *
 * @returns {Promise<Object>} - Paginated pricing data and metadata:
 * {
 *   data: Array<PricingListItem>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }
 *
 * @throws {AppError} - On validation failure or database error.
 */
const getAllPricingRecords = async ({
  page,
  limit,
  sortBy = 'brand',
  sortOrder,
  filters = {},
  keyword,
}) => {
  const tableName = 'pricing p';
  const joins = [
    'JOIN pricing_types pt ON pt.id = p.price_type_id',
    'JOIN skus s ON s.id = p.sku_id',
    'JOIN products pr ON pr.id = s.product_id',
  ];

  // Use extracted filter logic
  const { whereClause, params } = buildPricingFilters(filters, keyword);

  const baseQueryText = `
    SELECT
      p.id AS pricing_id,
      p.price,
      p.valid_from,
      p.valid_to,
      pt.id AS pricing_type_id,
      pt.name AS pricing_type,
      pt.code AS pricing_type_code,
      pt.slug AS pricing_type_slug,
      s.id AS sku_id,
      s.sku,
      s.country_code,
      s.size_label,
      s.barcode,
      pr.id AS product_id,
      pr.name AS product_name,
      pr.brand
    FROM ${tableName}
    ${joins.join(' ')}
    WHERE ${whereClause}
  `;

  try {
    logSystemInfo('Fetching paginated pricing records', {
      context: 'pricing-repository/getAllPricingRecords',
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
      keyword,
    });

    return await paginateQuery({
      tableName,
      joins,
      whereClause,
      queryText: baseQueryText,
      params,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  } catch (error) {
    logSystemException(error, 'Failed to fetch pricing records', {
      context: 'pricing-repository/getAllPricingRecords',
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
      keyword,
    });

    throw AppError.databaseError('Failed to fetch pricing list', error);
  }
};

/**
 * Fetches paginated pricing details associated with a specific pricing type ID.
 *
 * Includes metadata such as product, SKU, pricing information, location, and audit fields.
 *
 * @param {Object} options
 * @param {string} options.pricingTypeId - UUID of the pricing type to filter by.
 * @param {number} options.page - The page number for pagination.
 * @param {number} options.limit - The number of records per page.
 *
 * @returns {Promise<Object>} Paginated pricing detail records including SKU, product, price, and audit metadata.
 *
 * @throws {AppError} Throws a database error if the query fails.
 */
const getPricingDetailsByPricingTypeId = async ({
  pricingTypeId,
  page,
  limit,
}) => {
  const tableName = 'pricing p';
  const joins = [
    'JOIN pricing_types pt ON pt.id = p.price_type_id',
    'JOIN skus s ON s.id = p.sku_id',
    'JOIN products pr ON pr.id = s.product_id',
    'LEFT JOIN locations l ON l.id = p.location_id',
    'LEFT JOIN status pts ON pts.id = p.status_id', // pricing status
    'LEFT JOIN users uc ON uc.id = p.created_by', // pricing created_by
    'LEFT JOIN users uu ON uu.id = p.updated_by', // pricing updated_by
  ];
  const whereClause = 'p.price_type_id = $1';

  const pricingDetailsQuery = `
    SELECT
      pt.name AS pricing_type,
      p.location_id,
      l.name AS location_name,
      p.price,
      p.valid_from,
      p.valid_to,
      p.status_id AS pricing_status_id,
      pts.name AS pricing_status_name,
      p.created_at AS pricing_created_at,
      uc.firstname AS created_by_firstname,
      uc.lastname AS created_by_lastname,
      p.updated_at AS pricing_updated_at,
      p.updated_by AS pricing_updated_by,
      uu.firstname AS updated_by_firstname,
      uu.lastname AS updated_by_lastname,
      s.sku,
      s.barcode,
      s.country_code,
      s.size_label,
      pr.name AS product_name,
      pr.brand AS brand_name,
      COUNT(DISTINCT s.id) AS product_count
    FROM ${tableName}
    ${joins.join(' ')}
    WHERE ${whereClause}
    GROUP BY
      pt.name, p.location_id, l.name, p.price, p.valid_from, p.valid_to,
      p.status_id, pts.name, p.created_at, uc.firstname, uc.lastname, p.updated_at,
      p.updated_by, uu.firstname, uu.lastname, s.sku, s.barcode, s.country_code,
      s.size_label, pr.name, pr.brand
  `;

  try {
    logSystemInfo('Fetching pricing details by pricing type ID', {
      context: 'getPricingDetailsByPricingTypeId',
      pricingTypeId,
      page,
      limit,
    });

    return await paginateQuery({
      tableName,
      joins,
      whereClause,
      queryText: pricingDetailsQuery,
      params: [pricingTypeId],
      page,
      limit,
      sortBy: 'pr.name',
      sortOrder: 'ASC',
    });
  } catch (error) {
    logSystemException('Failed to fetch pricing details', {
      context: 'getPricingDetailsByPricingTypeId',
      pricingTypeId,
      page,
      limit,
      error,
    });

    throw AppError.databaseError('Failed to fetch pricing details', error);
  }
};

/**
 * Fetch pricing details with product, location, and created/updated user full names.
 * @param {Object} params - The parameters.
 * @param {string} params.pricingId - The UUID of the pricing record.
 * @param {number} params.page - The current page number.
 * @param {number} params.limit - The number of records per page.
 * @returns {Promise<Object>} - Returns pricing details with related product and location.
 */
const getPricingDetailsByPricingId = async ({ pricingId, page, limit }) => {
  const tableName = 'pricing p';

  const joins = [
    'LEFT JOIN products pr ON p.product_id = pr.id',
    'LEFT JOIN pricing_types pt ON p.price_type_id = pt.id',
    'LEFT JOIN locations l ON p.location_id = l.id',
    'LEFT JOIN location_types lt ON l.location_type_id = lt.id',
    'LEFT JOIN status s ON p.status_id = s.id',
    'LEFT JOIN users u1 ON p.created_by = u1.id',
    'LEFT JOIN users u2 ON p.updated_by = u2.id',
  ];

  const whereClause = 'p.id = $1';

  const baseQuery = `
      SELECT
        p.id AS pricing_id,
        pt.name AS price_type_name,
        p.price,
        p.valid_from,
        p.valid_to,
        s.name AS status_name,
        p.status_date,
        p.created_at,
        p.updated_at,
        COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
        COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by,
        jsonb_agg(DISTINCT jsonb_build_object(
            'product_id', pr.id,
            'name', pr.product_name,
            'brand', pr.brand,
            'category', pr.category,
            'barcode', pr.barcode,
            'market_region', pr.market_region
        )) AS products,
        jsonb_agg(DISTINCT jsonb_build_object(
            'location_id', l.id,
            'location_name', l.name,
            'location_type', jsonb_build_object(
                'type_id', lt.id,
                'type_name', lt.name
            )
        )) AS locations
      FROM ${tableName}
      ${joins.join(' ')}
      WHERE ${whereClause}
      GROUP BY p.id, pt.name, p.price, p.valid_from, p.valid_to,
      s.name, p.status_date, p.created_at, p.updated_at,
      u1.firstname, u1.lastname, u2.firstname, u2.lastname
  `;

  try {
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: baseQuery, // Corrected variable name
        params: [pricingId], // Corrected parameter name
        page,
        limit,
        sortBy: 'pt.name',
        sortOrder: 'ASC',
      });
    });
  } catch (error) {
    throw AppError.databaseError(
      `Error fetching pricing details: ${error.message}`,
      error
    );
  }
};

/**
 * Retrieves the active price ID and value for a given product and price type.
 *
 * This function queries the `pricing` table to fetch the most recent valid price
 * for the specified product and price type. It ensures that only active and valid
 * prices are considered, filtering by `status_id` and `valid_to` date.
 *
 * @param {string} productId - The unique identifier of the product.
 * @param {string} priceTypeId - The unique identifier of the price type.
 * @param {object} client - The database transaction client (optional).
 * @returns {Promise<{ price_id: string, price: number } | null>} - The active price details, or `null` if no valid price is found.
 */
const getActiveProductPrice = async (productId, priceTypeId, client) => {
  const queryText = `
    SELECT
      p.id,
      p.price
    FROM pricing p
    INNER JOIN status s ON p.status_id = s.id
    WHERE p.product_id = $1
      AND p.price_type_id = $2
      AND s.name = 'active'
      AND now() >= p.valid_from
      AND (p.valid_to IS NULL OR now() <= p.valid_to)
    ORDER BY p.valid_from DESC
    LIMIT 1;
  `;

  try {
    const { rows } = await query(queryText, [productId, priceTypeId], client);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logError('Error fetching price for order:', error);
    throw AppError.databaseError('Failed to fetch price for order');
  }
};

module.exports = {
  getAllPricingRecords,
  getPricingDetailsByPricingTypeId,
  getPricingDetailsByPricingId,
  getActiveProductPrice,
};

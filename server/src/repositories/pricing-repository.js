const { query, paginateQuery, paginateQueryByOffset } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const { buildPricingFilters } = require('../utils/sql/build-pricing-filters');

// const sq = `
// SELECT p.*
// FROM pricing p
// JOIN skus s ON s.id = p.sku_id
// WHERE s.id = '48fc7dcb-b44d-436b-8bbe-0c16f2d5f17b';
// `;

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
 * Fetches the price value for a given price ID and SKU ID.
 *
 * This function retrieves the price record where the provided price_id matches
 * the provided sku_id. It does not perform validation — it simply fetches the data.
 *
 * @param {string} price_id - The price ID to query.
 * @param {string} sku_id - The SKU ID to verify association with the price ID.
 * @param {object|null} client - Optional database client for transaction context.
 *
 * @returns {Promise<{ price: string } | null>} - The price record if found, or null.
 *
 * @throws {AppError} - If the query fails.
 */
const getPriceByIdAndSku = async (price_id, sku_id, client = null) => {
  try {
    const sql = `
      SELECT price
      FROM pricing
      WHERE id = $1 AND sku_id = $2
    `;
    const result = await query(sql, [price_id, sku_id], client);
    return result.rows[0] || null;
  } catch (error) {
    logSystemException(error, 'Failed to fetch price for SKU', {
      context: 'pricing-repository/getPriceByIdAndSku',
      price_id,
      sku_id,
    });
    throw AppError.databaseError(`Failed to fetch price for SKU.`, {
      details: error.message,
    });
  }
};

/**
 * Retrieves a paginated list of pricing records for use in dropdown or autocomplete components.
 *
 * Supports filtering by SKU, brand, price type, location, country, size label, status, and validity period.
 * Used in contexts such as sales order creation, SKU pricing selection, or administrative pricing lookup.
 *
 * @param {Object} options - Lookup options
 * @param {number} [options.limit=50] - Max number of results to return
 * @param {number} [options.offset=0] - Offset for pagination
 * @param {Object} [options.filters={}] - Optional filter fields (e.g., brand, priceType, currentlyValid, keyword)
 * @param {string} [options.keyword] - Optional keyword for fuzzy search (product name or SKU)
 * @returns {Promise<{ items: any[], hasMore: boolean }>} - Paginated pricing lookup result
 *
 * @throws {AppError} - If a database error occurs
 */
const getPricingLookup = async ({
                                  limit = 50,
                                  offset = 0,
                                  filters = {},
                                  keyword = '',
                                }) => {
  const tableName = 'pricing p';
  const joins = [
    'JOIN skus s ON s.id = p.sku_id',
    'JOIN pricing_types pt ON pt.id = p.price_type_id',
    'JOIN products pr ON pr.id = s.product_id',
    'LEFT JOIN locations l ON l.id = p.location_id',
  ];
  
  const { whereClause, params } = buildPricingFilters(filters, keyword);
  
  const queryText = `
    SELECT
      p.id,
      p.price,
      pt.name AS price_type,
      s.sku,
      s.barcode,
      s.size_label,
      s.market_region,
      s.country_code,
      l.name AS location_name,
      p.valid_from,
      p.valid_to,
      p.status_id
    FROM ${tableName}
    ${joins.join('\n')}
    WHERE ${whereClause}
  `;
  
  try {
    const result = await paginateQueryByOffset({
      tableName,
      joins,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: '',
      sortOrder: '',
      additionalSort: 'pt.name ASC, p.valid_from DESC',
    });
    
    logSystemInfo('Fetched pricing lookup successfully', {
      context: 'pricing-repository/getPricingLookup',
      totalFetched: result.items?.length ?? 0,
      offset,
      limit,
      filters,
      keyword,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch pricing lookup', {
      context: 'pricing-repository/getPricingLookup',
      offset,
      limit,
      filters,
      keyword,
    });
    throw AppError.databaseError('Failed to fetch pricing options.');
  }
};

module.exports = {
  getAllPricingRecords,
  getPricingDetailsByPricingTypeId,
  getPriceByIdAndSku,
  getPricingLookup,
};

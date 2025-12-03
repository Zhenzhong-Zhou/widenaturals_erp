const {
  query,
  paginateQuery,
  paginateQueryByOffset,
} = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
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
 * Fetch prices for multiple (price_id, sku_id) pairs in **one DB round-trip**.
 *
 * Behavior:
 * - Treats the two input arrays as **pairwise**: i-th `price_id` is matched with i-th `sku_id`.
 * - Returns **only** pairs that exist in `pricing` (`JOIN`), i.e. missing/invalid pairs are omitted.
 * - Does **not** throw for missing pairs — callers should check which pairs didn’t come back.
 * - Duplicate pairs are returned once per matching row from `pricing` (no explicit de-dup).
 *
 * Inputs:
 * - `pairs`: Array of objects `{ price_id, sku_id }`. Both must be non-null UUIDs.
 *   If your schema allows nullable `sku_id` in pricing, switch the JOIN to use `IS NOT DISTINCT FROM`.
 *
 * Performance:
 * - One `UNNEST` query; O(n) over the number of pairs with index lookups on `pricing(id, sku_id)`.
 *   Ensure an index exists on `pricing(id, sku_id)` (or at least on `id` and `sku_id` separately).
 *
 * Notes:
 * - This function **does not validate** that input UUIDs are well-formed; do that earlier if needed.
 * - Ideal for order enrichment/validation — combine with a Map at the call site for O(1) lookups.
 *
 * @param {{ price_id: string, sku_id: string }[]} pairs
 *   Pairwise arrays of IDs to check (length > 0). Example:
 *   `[ { price_id: '...', sku_id: '...' }, ... ]`
 * @param {import('pg').PoolClient|null} client
 *   Optional PG client/transaction.
 *
 * @returns {Promise<Array<{ price_id: string, sku_id: string, price: string }>>}
 *   Rows for matching pairs only. `price` is returned as stored (often TEXT/NUMERIC).
 *
 * @throws {AppError}
 *   `databaseError` if the query itself fails (connection/SQL issue).
 *
 * @example
 * const rows = await getPricesByIdAndSkuBatch(
 *   [{ price_id: 'p1', sku_id: 's1' }, { price_id: 'p2', sku_id: 's2' }],
 *   client
 * );
 * // Build a lookup map:
 * const priceMap = new Map(rows.map(r => [`${r.price_id}|${r.sku_id}`, Number(r.price)]));
 */
const getPricesByIdAndSkuBatch = async (pairs, client = null) => {
  try {
    if (!pairs?.length) return [];

    const priceIds = pairs.map((p) => p.price_id);
    const skuIds = pairs.map((p) => p.sku_id);

    const sql = `
      WITH input(price_id, sku_id) AS (
        SELECT * FROM UNNEST($1::uuid[], $2::uuid[])
      )
      SELECT i.price_id, i.sku_id, p.price
      FROM input i
      JOIN pricing p
        ON p.id = i.price_id
       AND p.sku_id = i.sku_id
    `;
    const { rows } = await query(sql, [priceIds, skuIds], client);
    return rows; // only the pairs that matched
  } catch (error) {
    logSystemException(error, 'Failed to fetch prices for pairs', {
      context: 'pricing-repository/getPricesByIdAndSkuBatch',
      count: pairs?.length ?? 0,
    });
    throw AppError.databaseError('Failed to fetch prices for pairs.', {
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
 * @returns {Promise<{ items: any[], hasMore: boolean }>} - Paginated pricing lookup result
 *
 * @throws {AppError} - If a database error occurs
 */
const getPricingLookup = async ({ limit = 50, offset = 0, filters = {} }) => {
  const tableName = 'pricing p';
  const joins = [
    'JOIN skus s ON s.id = p.sku_id',
    'JOIN pricing_types pt ON pt.id = p.price_type_id',
    'JOIN products pr ON pr.id = s.product_id',
    'LEFT JOIN locations l ON l.id = p.location_id',
  ];

  const { whereClause, params } = buildPricingFilters(filters);

  const queryText = `
    SELECT
      p.id,
      p.price,
      pt.name AS price_type,
      pr.name AS product_name,
      pr.brand,
      s.sku,
      s.barcode,
      s.size_label,
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
      totalFetched: result.data?.length ?? 0,
      offset,
      limit,
      filters,
    });

    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch pricing lookup', {
      context: 'pricing-repository/getPricingLookup',
      offset,
      limit,
      filters,
    });
    throw AppError.databaseError('Failed to fetch pricing options.');
  }
};

/**
 * Fetch all pricing records linked to a specific SKU.
 *
 * This repository returns the **raw, unfiltered pricing rows** used by the
 * business layer and access-control functions:
 *   - evaluatePricingViewAccessControl()
 *   - slicePricingForUser()
 *
 * The repository itself performs **no permission filtering**.
 *
 * ---------------------------------------------------------------------------
 * Normalized join structure:
 *   pricing (pr)
 *     └─ pricing_types (pt)
 *     └─ locations (l)
 *          └─ location_types (lt)
 *     └─ users (u1 = created_by, u2 = updated_by)
 *
 * Returned rows include:
 *   - Price type metadata
 *   - Location + location type
 *   - Status + status_date
 *   - Audit fields, including first/last name for created_by, updated_by
 *
 * ---------------------------------------------------------------------------
 * Ordering logic:
 *   1. Price type code (so similar types group together)
 *   2. valid_from DESC (newest pricing version first)
 *
 * ---------------------------------------------------------------------------
 * Typical usage:
 *   - SKU Detail Page (admin/full access)
 *   - Pricing history modal
 *   - Pricing comparisons across locations
 *   - Audit and compliance workflows
 *
 * ---------------------------------------------------------------------------
 * @async
 * @function
 *
 * @param {string} skuId - UUID of the SKU to fetch pricing for.
 *
 * @returns {Promise<Array<Object>>} Raw pricing rows with the shape:
 *   [
 *     {
 *       id: string,
 *       sku_id: string,
 *       price_type_id: string,
 *       price_type_name: string,
 *       price_type_code: string,
 *       location_id: string|null,
 *       location_name: string|null,
 *       location_type: string|null,
 *       price: number,
 *       valid_from: Date,
 *       valid_to: Date|null,
 *       status_id: string,
 *       status_date: Date,
 *       created_at: Date,
 *       updated_at: Date,
 *       created_by: string|null,
 *       created_by_firstname: string|null,
 *       created_by_lastname: string|null,
 *       updated_by: string|null,
 *       updated_by_firstname: string|null,
 *       updated_by_lastname: string|null
 *     }
 *   ]
 *
 * @throws {AppError} - On database or query failure.
 */
const getPricingBySkuId = async (skuId) => {
  const context = 'pricing-repository/getPricingBySkuId';

  // -------------------------------------------------------------------
  // SQL: Fetch raw pricing rows for the SKU + joined metadata
  // -------------------------------------------------------------------
  const queryText = `
    SELECT
      pr.id,
      pr.sku_id,
      pr.price_type_id,
      pt.name AS price_type_name,
      pt.code AS price_type_code,
      pr.location_id,
      l.name AS location_name,
      lt.name AS location_type,
      pr.price,
      pr.valid_from,
      pr.valid_to,
      pr.status_id,
      pr.status_date,
      pr.created_at,
      pr.updated_at,
      pr.created_by,
      u1.firstname AS created_by_firstname,
      u1.lastname AS created_by_lastname,
      pr.updated_by,
      u2.firstname AS updated_by_firstname,
      u2.lastname AS updated_by_lastname
    FROM pricing pr
    LEFT JOIN pricing_types pt ON pr.price_type_id = pt.id
    LEFT JOIN locations l ON pr.location_id = l.id
    LEFT JOIN location_types lt ON l.location_type_id = lt.id
    LEFT JOIN users u1 ON pr.created_by = u1.id
    LEFT JOIN users u2 ON pr.updated_by = u2.id
    WHERE pr.sku_id = $1
    ORDER BY
      pt.code ASC,
      pr.valid_from DESC
  `;

  try {
    const { rows } = await query(queryText, [skuId]);

    if (rows.length === 0) {
      logSystemInfo('No SKU pricing records found', {
        context,
        skuId,
      });
      return [];
    }

    logSystemInfo('Fetched SKU pricing successfully', {
      context,
      skuId,
      count: rows.length,
    });

    return rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch SKU pricing', {
      context,
      skuId,
      error: error.message,
    });

    throw AppError.databaseError('Failed to fetch SKU pricing.', {
      context,
      details: error.message,
    });
  }
};

module.exports = {
  getAllPricingRecords,
  getPricingDetailsByPricingTypeId,
  getPricesByIdAndSkuBatch,
  getPricingLookup,
  getPricingBySkuId,
};

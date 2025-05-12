const { query, paginateResults } = require('../database/db');
const {
  logSystemInfo,
  logSystemException
} = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { FILTERABLE_FIELDS } = require('../utils/filter-field-mapping');
const { sanitizeSortBy } = require('../utils/sort-utils');

/**
 * Retrieves the most recent SKU string for a given brand and category combination.
 *
 * Used to determine the next sequence number in SKU generation.
 *
 * @param {string} brandCode - Brand code (e.g., 'CH')
 * @param {string} categoryCode - Category code (e.g., 'HN')
 * @returns {Promise<string|null>} - The latest matching SKU or null if none found.
 */
const getLastSku = async (brandCode, categoryCode) => {
  try {
    const pattern = `${brandCode}-${categoryCode}%`; // e.g., 'CH-HN%'
    
    const sql = `
      SELECT sku
      FROM skus
      WHERE sku LIKE $1
      ORDER BY sku DESC
      LIMIT 1
    `;
    
    const result = await query(sql, [pattern]);
    
    const lastSku = result.rows[0]?.sku || null;
    
    logSystemInfo('[getLastSku] Retrieved last SKU', {
      brandCode,
      categoryCode,
      pattern,
      lastSku,
    });
    
    return lastSku;
  } catch (error) {
    logSystemException(error, 'Failed to fetch last SKU', {
      context: 'getLastSku',
      error: error.message,
      brandCode,
      categoryCode,
    });
    throw AppError.databaseError('Database error while retrieving last SKU', {
      brandCode,
      categoryCode,
    });
  }
};

/**
 * Builds a dynamic SQL WHERE clause and parameter array for filtering active SKUs and products.
 *
 * @param {string} productStatusId - UUID of the 'active' status to filter both products and SKUs.
 * @param {Object} [filters={}] - Optional filters to apply.
 * @param {string} [filters.brand] - Product brand (e.g., "Canaherb").
 * @param {string} [filters.category] - Product category (e.g., "Herbal Natural").
 * @param {string} [filters.marketRegion] - SKU market region (e.g., "CN", "CA").
 * @param {string} [filters.sizeLabel] - SKU size label (e.g., "60 Capsules").
 * @param {string} [filters.keyword] - Partial product name for search (ILIKE).
 * @returns {{ whereClause: string, params: Array<any> }} SQL-safe WHERE clause and parameter list.
 */
const buildWhereClauseAndParams = (productStatusId, filters = {}) => {
  try {
    const fieldMap = FILTERABLE_FIELDS.skuProductCards;
    const conditions = [`p.status_id = $1`, `sku.status_id = $1`];
    const params = [productStatusId];
    let paramIndex = 2;
    
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        const field = fieldMap[key];
        if (!field) continue;
        
        if (key === 'keyword') {
          conditions.push(`${field} ILIKE $${paramIndex}`);
          params.push(`%${value}%`);
        } else {
          conditions.push(`${field} = $${paramIndex}`);
          params.push(value);
        }
        
        paramIndex++;
      }
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to construct WHERE clause', {
      context: 'buildWhereClauseAndParams',
      error: err.message,
      filters,
      productStatusId,
    });
    throw AppError.transformerError('Failed to prepare filter conditions', {
      details: err.message,
      stage: 'build-where-clause',
    });
  }
};

/**
 * Fetch a paginated list of active SKUs for product display (e.g., product cards or grid).
 * Includes basic product info, active SKU data, NPN compliance, pricing (MSRP), and primary image.
 *
 * @param {Object} options - Query options for pagination and sorting.
 * @param {number} options.page - Current page number (1-based).
 * @param {number} options.limit - Number of items per page.
 * @param {string} [options.sortBy='p.name, p.created_at'] - Sort columns.
 * @param {string} [options.sortOrder='DESC'] - Sort direction ('ASC' or 'DESC').
 * @param {string} options.productStatusId - UUID of the 'active' status to filter both product and SKU.
 * @param {Object} [options.filters] - Optional filter object with keys like brand, category, marketRegion, sizeLabel, keyword
 * @returns {Promise<Object>} Paginated response:
 * {
 *   data: Array<{
 *     sku_id,
 *     sku,
 *     size_label,
 *     barcode,
 *     product_name,
 *     brand,
 *     series,
 *     category,
 *     status_name,
 *     sku_status_name,
 *     compliance_id,
 *     msrp_price,
 *     primary_image_url,
 *     image_alt_text
 *   }>,
 *   pagination: { page: number, limit: number, totalRecords: number, totalPages: number }
 * }
 */
const fetchPaginatedActiveSkusWithProductCards = async ({
                                                          page = 1,
                                                          limit = 10,
                                                          sortBy = 'name, created_at',
                                                          sortOrder = 'DESC',
                                                          productStatusId,
                                                          filters = {},
                                                        }) => {
  try {
    const { whereClause, params } = buildWhereClauseAndParams(productStatusId, filters);
    const orderBy = sanitizeSortBy(sortBy, 'skuProductCards');
    
    const queryText = `
      SELECT
        p.name AS product_name,
        p.series,
        p.brand,
        p.category,
        s.name AS status_name,
        sku.id AS sku_id,
        sku.sku,
        sku.barcode,
        sku.country_code,
        sku.market_region,
        sku.size_label,
        sku_status.name AS sku_status_name,
        comp.compliance_id,
        pr.price AS msrp_price,
        img.image_url AS primary_image_url,
        img.alt_text AS image_alt_text
      FROM skus sku
      INNER JOIN products p ON sku.product_id = p.id
      INNER JOIN status s ON p.status_id = s.id
      LEFT JOIN status sku_status ON sku.status_id = sku_status.id AND sku_status.id = $1
      LEFT JOIN compliances comp ON comp.sku_id = sku.id AND comp.type = 'NPN' AND comp.status_id = $1
      LEFT JOIN LATERAL (
        SELECT pr.price, pr.status_id
        FROM pricing pr
        INNER JOIN pricing_types pt ON pr.price_type_id = pt.id AND pt.name = 'MSRP'
        INNER JOIN locations l ON pr.location_id = l.id
        INNER JOIN location_types lt ON l.location_type_id = lt.id AND lt.name = 'Office'
        WHERE pr.sku_id = sku.id AND pr.status_id = $1
        ORDER BY pr.valid_from DESC NULLS LAST
        LIMIT 1
      ) pr ON TRUE
      LEFT JOIN sku_images img ON img.sku_id = sku.id AND img.is_primary = TRUE
      LEFT JOIN status ps ON pr.status_id = ps.id AND ps.id = $1
      WHERE ${whereClause}
      GROUP BY
        p.id, s.name,
        sku.id, sku.sku, sku.barcode, sku.market_region, sku.size_label, sku_status.name,
        comp.compliance_id,
        pr.price,
        img.image_url, img.alt_text
      ORDER BY ${orderBy} ${sortOrder}
    `;
    
    logSystemInfo('Fetching paginated active SKUs with product cards', null, {
      context: 'fetchPaginatedActiveSkusWithProductCards',
      filters,
      sortBy: orderBy,
      sortOrder,
      page,
      limit,
    });
    
    return await paginateResults({
      dataQuery: queryText,
      params,
      page,
      limit,
    });
  } catch (error) {
    logSystemException(error, 'Error fetching active SKUs with product cards', {
      context: 'fetchPaginatedActiveSkusWithProductCards',
      stage: 'query-execution',
    });
    throw AppError.databaseError('Failed to fetch active product SKUs', {
      details: error.message,
    });
  }
};

/**
 * Fetches the status IDs of both SKU and its parent product.
 *
 * @param {string} skuId - UUID of the SKU
 * @returns {Promise<{ skuStatusId: string, productStatusId: string }>} - Status info
 * @throws {AppError} If SKU not found
 */
const getSkuAndProductStatus = async (skuId) => {
  const queryText = `
    SELECT
      sku.status_id AS "skuStatusId",
      p.status_id AS "productStatusId"
    FROM skus AS sku
    JOIN products AS p ON sku.product_id = p.id
    WHERE sku.id = $1
    LIMIT 1;
  `;

  try {
    const result = await query(queryText, [skuId]);

    if (result.rows.length === 0) {
      logSystemInfo('SKU not found during status check', {
        context: 'getSkuAndProductStatus',
        skuId,
      });

      throw AppError.notFoundError('SKU not found');
    }

    return result.rows[0];
  } catch (error) {
    logSystemException('Failed to fetch SKU and product status', {
      context: 'getSkuAndProductStatus',
      skuId,
      error,
    });

    throw AppError.databaseError('Could not retrieve SKU status information');
  }
};

/**
 * Fetches detailed SKU metadata including pricing, compliance, images, and audit info.
 * Filters by allowed status IDs for both SKU and its parent product.
 *
 * @param {string} skuId - The UUID of the SKU to fetch.
 * @param {string[] | null} allowedStatusIds - Filter for allowed product/SKU statuses (null = no filter)
 * @param {string[] | null} allowedPricingTypes - Filter for allowed pricing types by code (null = no filter)
 * @returns {Promise<object>} Transformed SKU metadata for frontend rendering.
 * @throws {AppError} If the SKU does not exist or status is not permitted.
 */
const getSkuDetailsWithPricingAndMeta = async (
  skuId,
  {
    allowedStatusIds = null,
    allowedPricingTypes = null,
  } = {}
) => {
  const queryText = `
    SELECT
      sku.id AS sku_id,
      sku.sku,
      sku.barcode,
      sku.language,
      sku.country_code,
      sku.market_region,
      sku.size_label,
      sku.description AS sku_description,
      sku.length_cm,
      sku.width_cm,
      sku.height_cm,
      sku.weight_g,
      sku.length_inch,
      sku.width_inch,
      sku.height_inch,
      sku.weight_lb,
      sku.status_date AS sku_status_date,
      sku.created_at AS sku_created_at,
      sku.updated_at AS sku_updated_at,
      sku.created_by AS sku_created_by,
      sku_creator.firstname AS sku_created_by_firstname,
      sku_creator.lastname AS sku_created_by_lastname,
      sku.updated_by AS sku_updated_by,
      sku_updater.firstname AS sku_updated_by_firstname,
      sku_updater.lastname AS sku_updated_by_lastname,
      sku.updated_at AS sku_updated_at,
      p.id AS product_id,
      p.name AS product_name,
      p.series,
      p.brand,
      p.category,
      p.description AS product_description,
      p.status_date AS product_status_date,
      p.created_at AS product_created_at,
      p.updated_at AS product_updated_at,
      p.created_by AS product_created_by,
      product_creator.firstname AS product_created_by_firstname,
      product_creator.lastname AS product_created_by_lastname,
      p.updated_by AS product_updated_by,
      product_updater.firstname AS product_updated_by_firstname,
      product_updater.lastname AS product_updated_by_lastname,
      sku_status.name AS sku_status_name,
      prod_status.name AS product_status_name,
      COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object(
          'pricing_type', pt.name,
          'price', pr.price,
          'valid_from', pr.valid_from,
          'valid_to', pr.valid_to,
          'location', l.name,
          'location_type', lt.name
        )) FILTER (WHERE pr.id IS NOT NULL),
        '[]'
      ) AS prices,
      COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object(
          'type', c.type,
          'compliance_id', c.compliance_id,
          'issued_date', c.issued_date,
          'expiry_date', c.expiry_date,
          'description', c.description
        )) FILTER (WHERE c.id IS NOT NULL),
        '[]'
      ) AS compliances,
      COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object(
          'image_url', img.image_url,
          'type', img.image_type,
          'order', img.display_order,
          'is_primary', img.is_primary,
          'alt_text', img.alt_text
        )) FILTER (WHERE img.id IS NOT NULL),
        '[]'
      ) AS images
    FROM skus AS sku
    JOIN products AS p ON sku.product_id = p.id
    JOIN status AS sku_status ON sku.status_id = sku_status.id
    JOIN status AS prod_status ON p.status_id = prod_status.id
    LEFT JOIN users AS sku_creator ON sku.created_by = sku_creator.id
    LEFT JOIN users AS sku_updater ON sku.updated_by = sku_updater.id
    LEFT JOIN users AS product_creator ON p.created_by = product_creator.id
    LEFT JOIN users AS product_updater ON p.updated_by = product_updater.id
    LEFT JOIN pricing AS pr ON pr.sku_id = sku.id
    LEFT JOIN pricing_types AS pt ON pr.price_type_id = pt.id
    LEFT JOIN locations AS l ON pr.location_id = l.id
    LEFT JOIN location_types AS lt ON l.location_type_id = lt.id
    LEFT JOIN compliances AS c ON c.sku_id = sku.id
    LEFT JOIN sku_images AS img ON img.sku_id = sku.id
    WHERE sku.id = $1
      AND ($2::uuid[] IS NULL OR sku_status.id = ANY($2))
      AND ($2::uuid[] IS NULL OR prod_status.id = ANY($2))
      AND ($3::text[] IS NULL OR pt.code = ANY($3))
    GROUP BY
      sku.id,
      p.id,
      sku_status.name,
      prod_status.name,
      sku_creator.firstname,
      sku_creator.lastname,
      sku_updater.firstname,
      sku_updater.lastname,
      product_creator.firstname,
      product_creator.lastname,
      product_updater.firstname,
      product_updater.lastname
  `;

  try {
    const result = await query(queryText, [skuId, allowedStatusIds, allowedPricingTypes]);

    if (result.rows.length === 0) {
      logSystemInfo('SKU not found or filtered out by status', {
        context: 'fetchSkuDetailsWithPricingAndMeta',
        skuId,
        allowedStatusIds,
        allowedPricingTypes,
      });

      throw AppError.notFoundError('SKU not found or not visible under current status filter');
    }
console.log(result.rows);
    return result.rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to fetch SKU details with meta', {
      context: 'fetchSkuDetailsWithPricingAndMeta',
      allowedStatusIds,
      allowedPricingTypes,
    });

    throw AppError.databaseError('Failed to retrieve SKU details');
  }
};

module.exports = {
  getLastSku,
  fetchPaginatedActiveSkusWithProductCards,
  getSkuAndProductStatus,
  getSkuDetailsWithPricingAndMeta,
};

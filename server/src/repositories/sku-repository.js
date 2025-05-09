const { query, paginateResults } = require('../database/db');
const { logError, logInfo } = require('../utils/logger-helper');
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
    return result.rows[0]?.sku || null;
  } catch (error) {
    logError('[getLastSku] Failed to fetch last SKU');
    throw AppError.databaseError('Database error while retrieving last SKU');
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
    console.error('Failed to build WHERE clause:', err.message);
    throw new Error('Internal error preparing filter conditions');
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
  
  try {
    logInfo('Fetching paginated active SKUs with product cards');
    
    return await paginateResults({
      dataQuery: queryText,
      params,
      page,
      limit,
    });
  } catch (error) {
    logError('Error fetching active SKUs with product cards');
    throw AppError.databaseError('Failed to fetch active product SKUs');
  }
};

module.exports = {
  getLastSku,
  fetchPaginatedActiveSkusWithProductCards,
};

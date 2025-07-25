const { query, paginateResults, paginateQueryByOffset } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { buildWhereClauseAndParams, skuDropdownKeywordHandler } = require('../utils/sql/build-sku-filters');
const { minUuid } = require('../utils/sql/sql-helpers');

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
      context: 'sku-repository/getLastSku',
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
    const { whereClause, params } = buildWhereClauseAndParams(
      productStatusId,
      filters
    );

    const queryText = `
      SELECT
        p.name AS product_name,
        p.series,
        p.brand,
        p.category,
        st.name AS status_name,
        s.id AS sku_id,
        s.sku,
        s.barcode,
        s.country_code,
        s.market_region,
        s.size_label,
        sku_status.name AS sku_status_name,
        comp.compliance_id,
        pr.price AS msrp_price,
        img.image_url AS primary_image_url,
        img.alt_text AS image_alt_text
      FROM skus s
      INNER JOIN products p ON s.product_id = p.id
      INNER JOIN status st ON p.status_id = st.id
      LEFT JOIN status sku_status ON s.status_id = sku_status.id AND sku_status.id = $1
      LEFT JOIN compliances comp ON comp.sku_id = s.id AND comp.type = 'NPN' AND comp.status_id = $1
      LEFT JOIN LATERAL (
        SELECT pr.price, pr.status_id
        FROM pricing pr
        INNER JOIN pricing_types pt ON pr.price_type_id = pt.id AND pt.name = 'MSRP'
        INNER JOIN locations l ON pr.location_id = l.id
        INNER JOIN location_types lt ON l.location_type_id = lt.id AND lt.name = 'Office'
        WHERE pr.sku_id = s.id AND pr.status_id = $1
        ORDER BY pr.valid_from DESC NULLS LAST
        LIMIT 1
      ) pr ON TRUE
      LEFT JOIN sku_images img ON img.sku_id = s.id AND img.is_primary = TRUE
      LEFT JOIN status ps ON pr.status_id = ps.id AND ps.id = $1
      WHERE ${whereClause}
      GROUP BY
        p.id, st.name,
        s.id, s.sku, s.barcode, s.market_region, s.size_label, sku_status.name,
        comp.compliance_id,
        pr.price,
        img.image_url, img.alt_text
      ORDER BY ${sortBy} ${sortOrder}
    `;

    logSystemInfo('Fetching paginated active SKUs with product cards', null, {
      context: 'sku-repository/fetchPaginatedActiveSkusWithProductCards',
      filters,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    return await paginateResults({
      dataQuery: queryText,
      params,
      filters,
      sortBy,
      sortOrder,
      page,
      limit,
    });
  } catch (error) {
    logSystemException(error, 'Error fetching active SKUs with product cards', {
      context: 'sku-repository/fetchPaginatedActiveSkusWithProductCards',
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
        context: 'sku-repository/getSkuAndProductStatus',
        skuId,
      });

      throw AppError.notFoundError('SKU not found');
    }

    return result.rows[0];
  } catch (error) {
    logSystemException('Failed to fetch SKU and product status', {
      context: 'sku-repository/getSkuAndProductStatus',
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
  { allowedStatusIds = null, allowedPricingTypes = null } = {}
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
    const result = await query(queryText, [
      skuId,
      allowedStatusIds,
      allowedPricingTypes,
    ]);

    if (result.rows.length === 0) {
      logSystemInfo('SKU not found or filtered out by status', {
        context: 'sku-repository/getSkuDetailsWithPricingAndMeta',
        skuId,
        allowedStatusIds,
        allowedPricingTypes,
      });

      throw AppError.notFoundError(
        'SKU not found or not visible under current status filter'
      );
    }

    return result.rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to fetch SKU details with meta', {
      context: 'sku-repository/getSkuDetailsWithPricingAndMeta',
      allowedStatusIds,
      allowedPricingTypes,
    });

    throw AppError.databaseError('Failed to retrieve SKU details');
  }
};

/**
 * Fetches SKU lookup options for dropdowns, with support for filtering, pagination,
 * and privileged access to additional diagnostic fields (status and inventory joins).
 *
 * This function builds a dynamic query with joins based on access options.
 * For users with `allowAllSkus`, the query will also join inventory, product, batch,
 * and status tables to allow downstream analysis of availability and abnormal flags.
 *
 * Typically used in UI dropdowns or internal search flows where SKU selection is needed.
 *
 * @param {Object} params - Parameter object.
 * @param {string} params.productStatusId - UUID of the expected product status. Required unless `options.allowAllSkus` is true.
 * @param {Object} [params.filters={}] - Optional filtering fields, e.g., brand, category, region, sizeLabel, keyword.
 * @param {Object} [params.options={}] - Visibility and diagnostic options.
 * @param {number} [params.limit=50] - Pagination limit (default: 50).
 * @param {number} [params.offset=0] - Pagination offset for paged results (default: 0).
 *
 * @returns {Promise<{
 *   items: Array<{
 *     id: string,
 *     sku: string,
 *     product_name: string,
 *     brand: string,
 *     barcode: string,
 *     country_code: string,
 *     size_label: string,
 *     // Additional diagnostic fields included only if allowAllSkus is true:
 *     sku_status_id?: string,
 *     product_status_id?: string,
 *     warehouse_status_id?: string,
 *     location_status_id?: string,
 *     batch_status_id?: string
 *   }>,
 *   totalCount: number
 * }>} Resolves to a paginated list of SKU rows for dropdown consumption.
 *
 * @throws {AppError} If a query fails due to invalid input or database errors.
 */
const getSkuLookup = async ({
                              productStatusId,
                              filters = {},
                              options = {},
                              limit = 50,
                              offset = 0,
                            }) => {
  const { whereClause, params } = buildWhereClauseAndParams(
    productStatusId,
    filters,
    skuDropdownKeywordHandler,
    options,
  );
  
  const tableName = 'skus s';
  
  const baseJoins = ['LEFT JOIN products p ON s.product_id = p.id'];
  
  // Determine whether to include joins for extended diagnostics
  const privilegedJoins = options.allowAllSkus
    ? [
      ...baseJoins,
      
      // Join for SKU + product status
      'LEFT JOIN status sku_status ON sku_status.id = s.status_id',
      'LEFT JOIN status product_status ON product_status.id = p.status_id',
      
      // ----- Warehouse inventory join chain -----
      'LEFT JOIN product_batches pb_wi ON pb_wi.sku_id = s.id',
      'LEFT JOIN batch_registry br_wi ON br_wi.product_batch_id = pb_wi.id',
      'LEFT JOIN warehouse_inventory wi ON wi.batch_id = br_wi.id',
      'LEFT JOIN inventory_status warehouse_status ON warehouse_status.id = wi.status_id',
      
      // ----- Location inventory join chain -----
      'LEFT JOIN product_batches pb_li ON pb_li.sku_id = s.id',
      'LEFT JOIN batch_registry br_li ON br_li.product_batch_id = pb_li.id',
      'LEFT JOIN location_inventory li ON li.batch_id = br_li.id',
      'LEFT JOIN inventory_status location_status ON location_status.id = li.status_id',
      'LEFT JOIN batch_registry br ON br.id = COALESCE(wi.batch_id, li.batch_id)',
      'LEFT JOIN product_batches pb ON pb.id = br.product_batch_id',
      'LEFT JOIN batch_status batch_status ON batch_status.id = pb.status_id',
    ]
    : baseJoins;
  
  const joins = options.allowAllSkus ? privilegedJoins : baseJoins;
  
  const groupedSelectFields = [
    's.id',
    'MIN(s.sku) AS sku',
    'MIN(s.barcode) AS barcode',
    'MIN(s.country_code) AS country_code',
    'MIN(p.name) AS product_name',
    'MIN(p.brand) AS brand',
    'MIN(s.size_label) AS size_label',
  ];
  
  // Select fields to group by and return in SELECT clause
  const privilegedGroupedSelectFields = options.allowAllSkus
    ? [
      ...groupedSelectFields,
      minUuid('p', 'status_id', 'product_status_id'),
      minUuid('s', 'status_id', 'sku_status_id'),
      minUuid('wi', 'status_id', 'warehouse_status_id'),
      minUuid('li', 'status_id', 'location_status_id'),
      minUuid('pb', 'status_id', 'batch_status_id'),
    ]
    : groupedSelectFields;
  
  // Note: GROUP BY s.id and MIN() aggregation are used to deduplicate rows per SKU,
  //       since one SKU may link to multiple inventory or batch entries.
  const queryText = `
    SELECT
      ${privilegedGroupedSelectFields.join(',\n')}
    FROM ${tableName}
    ${joins.join('\n')}
    WHERE ${whereClause}
    GROUP BY s.id
    ORDER BY MIN(p.brand), MIN(p.name)
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
      sortBy: null, // Avoid duplication with additionalSort
      sortOrder: null, // Not needed if sortBy is null
      additionalSort: `
        p.brand ASC,
        CAST(NULLIF(REGEXP_REPLACE(p.name, '[^0-9]', '', 'g'), '') AS INTEGER) NULLS LAST,
        p.name ASC
      `,
    });
    
    logSystemInfo('Fetched SKU dropdown lookup successfully', {
      context: 'sku-repository/getSkuDropdownOptions',
      totalFetched: result.items?.length ?? 0,
      totalAvailable: result.totalCount ?? null,
      offset,
      limit,
      filters,
      options,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch SKU dropdown options', {
      context: 'sku-repository/getSkuDropdownOptions',
      offset,
      limit,
      filters,
      options,
    });
    
    throw AppError.databaseError('Failed to fetch SKU options for dropdown.');
  }
};

module.exports = {
  getLastSku,
  fetchPaginatedActiveSkusWithProductCards,
  getSkuAndProductStatus,
  getSkuDetailsWithPricingAndMeta,
  getSkuLookup
};

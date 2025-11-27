const {
  query,
  paginateResults,
  paginateQueryByOffset,
  bulkInsert,
  updateById,
} = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const {
  buildWhereClauseAndParams,
  skuDropdownKeywordHandler,
  buildSkuFilter, buildSkuProductCardFilters,
} = require('../utils/sql/build-sku-filters');
const { minUuid } = require('../utils/sql/sql-helpers');
const { getSortMapForModule } = require('../utils/sort-utils');

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
 * Fetches paginated SKU product-card rows with combined product, SKU,
 * pricing, compliance, and image metadata.
 *
 * This repository function expects visibility rules (active-only,
 * inactive allowed, etc.) to already be applied by the service/business
 * layer via the `filters` argument.
 *
 * @param {Object} options
 * @param {number} options.page - Page number (1-based).
 * @param {number} options.limit - Items per page.
 * @param {string} options.sortBy - Fully-qualified sort column.
 * @param {string} options.sortOrder - Sort direction ('ASC' | 'DESC').
 * @param {Object} options.filters - Pre-normalized filters prepared by business logic.
 *
 * @returns {Promise<{
 *   data: Array<Object>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }>}
 */
const getPaginatedSkuProductCards = async ({
  page = 1,
  limit = 10,
  sortBy = 's.created_at',
  sortOrder = 'DESC',
  filters = {},
}) => {
  const context = 'sku-repository/getPaginatedSkuProductCards';
  
  // ---------------------------------------------------------
  // 1. Build WHERE clause + params from filters
  // ---------------------------------------------------------
  const { whereClause, params } = buildSkuProductCardFilters(filters);
  
  // ---------------------------------------------------------
  // 2. Core Product-Card SQL (dependencies: products, skus,
  //    compliance, MSRP price, status, primary image)
  // ---------------------------------------------------------
  const queryText = `
    SELECT
      p.name AS product_name,
      p.series,
      p.brand,
      p.category,
      st.name AS product_status_name,
      s.id AS sku_id,
      s.sku AS sku_code,
      s.barcode,
      s.country_code,
      s.market_region,
      s.size_label,
      sku_status.name AS sku_status_name,
      cr.type AS compliance_type,
      cr.compliance_id AS compliance_id,
      pr.price AS msrp_price,
      img.image_url AS primary_image_url,
      img.alt_text AS image_alt_text
    FROM skus s
    INNER JOIN products p
      ON s.product_id = p.id
    INNER JOIN status st
      ON p.status_id = st.id
    LEFT JOIN status sku_status
      ON s.status_id = sku_status.id
    LEFT JOIN sku_compliance_links scl
      ON scl.sku_id = s.id
    LEFT JOIN compliance_records cr
      ON cr.id = scl.compliance_record_id
    LEFT JOIN LATERAL (
      SELECT pr.price, pr.status_id
      FROM pricing pr
      INNER JOIN pricing_types pt
        ON pr.price_type_id = pt.id
       AND pt.name = 'MSRP'
      INNER JOIN locations l
        ON pr.location_id = l.id
      INNER JOIN location_types lt
        ON l.location_type_id = lt.id
       AND lt.name = 'Office'
      WHERE pr.sku_id = s.id
      ORDER BY pr.valid_from DESC NULLS LAST
      LIMIT 1
    ) pr ON TRUE
    LEFT JOIN status ps
      ON pr.status_id = ps.id
    LEFT JOIN sku_images img
      ON img.sku_id = s.id
     AND img.is_primary = TRUE
    WHERE ${whereClause}
    GROUP BY
      p.id,
      st.name,
      s.id,
      s.sku,
      s.barcode,
      s.market_region,
      s.size_label,
      sku_status.name,
      cr.compliance_id,
      cr.type,
      pr.price,
      img.image_url,
      img.alt_text
    ORDER BY ${sortBy} ${sortOrder};
  `;
  
  try {
    // ---------------------------------------------------------
    // 3. Logging
    // ---------------------------------------------------------
    logSystemInfo('Executing product-card SKU pagination query', {
      context,
      filters,
      sortBy,
      sortOrder,
      page,
      limit,
    });
    
    // ---------------------------------------------------------
    // 4. Execute paginated query
    // ---------------------------------------------------------
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
    logSystemException(error, 'Failed to fetch SKU product cards', {
      context,
      stage: 'query-execution',
      details: error.message,
    });
    
    throw AppError.databaseError('Failed to fetch SKU product cards', {
      details: error.message,
      context,
    });
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
 * - The query performs deduplication using GROUP BY `s.id` with MIN() aggregation.
 * - If `allowAllSkus` is true, it counts `DISTINCT s.id` in pagination to avoid
 *   overcounting rows due to inventory or batch joins.
 *
 * Typically used in UI dropdowns or internal search flows where SKU selection is needed.
 *
 * @param {Object} params - Parameter object.
 * @param {string} params.productStatusId - UUID of the expected product status.
 *   Required unless `options.allowAllSkus` is true.
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
    options
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

  const baseSelectFields = [
    's.id',
    'MIN(s.sku) AS sku',
    'MIN(s.barcode) AS barcode',
    'MIN(s.country_code) AS country_code',
    'MIN(p.name) AS product_name',
    'MIN(p.brand) AS brand',
    'MIN(s.size_label) AS size_label',
  ];

  const diagnosticSelects = [
    minUuid('p', 'status_id', 'product_status_id'),
    minUuid('s', 'status_id', 'sku_status_id'),
    minUuid('wi', 'status_id', 'warehouse_status_id'),
    minUuid('li', 'status_id', 'location_status_id'),
    minUuid('pb', 'status_id', 'batch_status_id'),
  ];

  // Select fields to group by and return in SELECT clause
  const groupedSelectFields = options.allowAllSkus
    ? [...baseSelectFields, ...diagnosticSelects]
    : baseSelectFields;

  // Note: GROUP BY s.id and MIN() aggregation are used to deduplicate rows per SKU,
  //       since one SKU may link to multiple inventory or batch entries.
  const queryText = `
    SELECT
      ${groupedSelectFields.join(',\n')}
    FROM ${tableName}
    ${joins.join('\n')}
    WHERE ${whereClause}
    GROUP BY s.id
    ORDER BY
      MIN(p.brand) ASC,
      LPAD(REGEXP_REPLACE(MIN(p.name), '[^0-9]', '', 'g'), 10, '0') NULLS LAST,
      MIN(p.name) ASC,
      s.id
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
        LPAD(REGEXP_REPLACE(p.name, '[^0-9]', '', 'g'), 10, '0') NULLS LAST,
        p.name ASC,
        s.id
      `,
      useDistinct: !!options.allowAllSkus,
      distinctColumn: options.allowAllSkus ? 's.id' : undefined,
    });

    logSystemInfo('Fetched SKU dropdown lookup successfully', {
      context: 'sku-repository/getSkuLookup',
      totalFetched: result.data?.length ?? 0,
      totalAvailable: result.pagination.totalRecords ?? null,
      offset,
      limit,
      filters,
      options,
    });

    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch SKU dropdown options', {
      context: 'sku-repository/getSkuLookup',
      offset,
      limit,
      filters,
      options,
    });

    throw AppError.databaseError('Failed to fetch SKU options for dropdown.');
  }
};

/**
 * Repository: Get Paginated SKU Records
 *
 * Retrieves SKU records with pagination, SQL-safe sorting, filtering,
 * and related product/status metadata. Follows the same pagination
 * pattern used by outbound shipment repositories for consistency.
 *
 * ### Filtering
 * Accepts filter criteria generated by `buildSkuFilter()`, supporting:
 * - statusIds[]
 * - productIds[]
 * - sku / barcode (partial match)
 * - language, country_code
 * - marketRegion, sizeLabel
 * - dimensional filters (length/width/height/weight in cm/in)
 *
 * ### Sorting
 * `sortBy` is expected to be **an already-mapped SQL column** provided by
 * the controller (via sortMap). The repository performs an additional
 * allowlist check using the same sortMap to ensure ORDER BY safety.
 *
 * On invalid or unsafe sort fields, the repository falls back to the
 * module's `defaultNaturalSort` value.
 *
 * ### Pagination
 * Uses a shared pagination helper (`paginateResults`) which applies:
 * - LIMIT
 * - OFFSET
 * - total row count query
 *
 * Returns:
 * - `data`: Array of transformed row objects
 * - `meta`: { page, limit, total, totalPages }
 *
 * @param {Object} options
 * @param {Object} [options.filters={}]      Finalized filter criteria
 * @param {number} [options.page=1]          Page number (1-based)
 * @param {number} [options.limit=10]        Number of rows per page
 * @param {string} [options.sortBy='s.created_at']
 *        SQL column name (already mapped from sortMap)
 * @param {string} [options.sortOrder='DESC']
 *        Sort direction ("ASC" | "DESC")
 *
 * @returns {Promise<{ data: Array<Object>, meta: Object }>}
 *
 * @throws {AppError} Database error if query or pagination fails.
 */
const getPaginatedSkus = async ({
                                  filters = {},
                                  page = 1,
                                  limit = 10,
                                  sortBy = 's.created_at',
                                  sortOrder = 'DESC',
                                }) => {
  const context = 'sku-repository/getPaginatedSkus';
  
  // 1. Load module sort map
  const sortMap = getSortMapForModule('skuSortMap');
  
  // 2. Allowed SQL columns
  const allowedSort = new Set(Object.values(sortMap));
  
  // 3. Final SQL-safe sort column
  let sortByColumn = sortBy;
  if (!allowedSort.has(sortByColumn)) {
    sortByColumn = sortMap.defaultNaturalSort;
  }
  
  try {
    // ------------------------------------
    // 1. Build WHERE clause + params
    // ------------------------------------
    const { whereClause, params } = buildSkuFilter(filters);
    
    // ------------------------------------
    // 2. Build the SELECT query
    // ------------------------------------
    const dataQuery = `
      SELECT
        s.id AS sku_id,
        s.product_id,
        p.name AS product_name,
        p.series,
        p.brand,
        p.category,
        s.sku,
        s.barcode,
        s.language,
        s.country_code,
        s.market_region,
        s.size_label,
        s.status_id,
        st.name AS status_name,
        s.status_date,
        s.created_at,
        s.updated_at,
        s.created_by,
        u1.firstname AS created_by_firstname,
        u1.lastname AS created_by_lastname,
        s.updated_by,
        u2.firstname AS updated_by_firstname,
        u2.lastname AS updated_by_lastname
      FROM skus s
      LEFT JOIN products p ON p.id = s.product_id
      LEFT JOIN status st ON st.id = s.status_id
      LEFT JOIN users u1 ON s.created_by = u1.id
      LEFT JOIN users u2 ON s.updated_by = u2.id
      WHERE ${whereClause}
      ORDER BY ${sortByColumn} ${sortOrder}
    `;
    
    // ------------------------------------
    // 3. Execute pagination helper
    // ------------------------------------
    const result = await paginateResults({
      dataQuery,
      params,
      page,
      limit,
      meta: { context },
    });
    
    // ------------------------------------
    // 4. Logging
    // ------------------------------------
    logSystemInfo('Fetched paginated SKU records successfully', {
      context,
      filters,
      pagination: { page, limit },
      sorting: { sortBy: sortByColumn, sortOrder },
      count: result.data.length,
    });
    
    return result;
    
  } catch (error) {
    // ------------------------------------
    // 5. Error handling
    // ------------------------------------
    logSystemException(
      error,
      'Failed to fetch paginated SKU records',
      {
        context,
        filters,
        pagination: { page, limit },
        sorting: { sortBy: sortByColumn, sortOrder },
      }
    );
    
    throw AppError.databaseError(
      'Failed to fetch paginated SKU records.',
      { context }
    );
  }
};

/**
 * @async
 * @function
 * @description
 * Checks whether a barcode already exists in the `skus` table.
 *
 * Behavior:
 * - Returns `false` immediately if barcode is null/empty (no validation needed)
 * - Performs a fast `SELECT 1 LIMIT 1` existence check
 * - Logs both success and failure paths for debugging/auditing
 *
 * @example
 * const exists = await checkBarcodeExists('1234567890123', client);
 * if (exists) throw AppError.conflictError('Barcode already in use.');
 *
 * @param {string} barcode - The barcode to validate (EAN, UPC, internal code, etc.)
 * @param {object} client - Active PG client or transaction handler.
 * @returns {Promise<boolean>} True if barcode exists, otherwise false.
 */
const checkBarcodeExists = async (barcode, client) => {
  const context = 'sku-repository/checkBarcodeExists';
  
  // no barcode → nothing to check
  if (!barcode) {
    logSystemInfo('Skipped barcode existence check (empty barcode)', {
      context,
      barcode,
    });
    return false;
  }
  
  const sql = `
    SELECT 1
    FROM skus
    WHERE barcode = $1
    LIMIT 1;
  `;
  
  try {
    const { rows } = await query(sql, [barcode], client);
    const exists = rows.length > 0;
    
    logSystemInfo('Checked barcode existence', {
      context,
      barcode,
      exists,
    });
    
    return exists;
  } catch (error) {
    logSystemException(error, 'Failed to check barcode existence.', {
      context,
      barcode,
    });
    
    throw AppError.databaseError('Failed to check barcode existence.', {
      cause: error,
      context,
    });
  }
};

/**
 * @async
 * @function
 * @description
 * Checks if a SKU already exists for a given product.
 *
 * @example
 * const exists = await checkSkuExists('CH-HN101-R-CN', 'product-uuid', client);
 * if (exists) throw AppError.conflictError('SKU already exists.');
 *
 * @param {string} sku - SKU code (e.g. "CH-HN117-R-CN").
 * @param {string} productId - Product UUID.
 * @param {object} client - Active PG client or transaction.
 * @returns {Promise<boolean>} True if the SKU exists, false otherwise.
 */
const checkSkuExists = async (sku, productId, client) => {
  const context = 'sku-repository/checkSkuExists';
  
  const sql = `
    SELECT 1
    FROM skus
    WHERE sku = $1 AND product_id = $2
    LIMIT 1;
  `;
  
  try {
    const { rows } = await query(sql, [sku, productId], client);
    const exists = rows.length > 0;
    
    logSystemInfo('Checked SKU existence', {
      context,
      sku,
      productId,
      exists,
    });
    
    return exists;
  } catch (error) {
    logSystemException(error, 'Failed to check SKU existence.', {
      context,
      sku,
      productId,
    });
    throw AppError.databaseError('Failed to check SKU existence.', { cause: error });
  }
};

/**
 * @async
 * @function
 * @description
 * Inserts one or multiple SKU records into the database efficiently.
 *
 * - Supports **bulk insertion** (multi-row VALUES syntax).
 * - Applies **ON CONFLICT (product_id, sku)** upsert logic to avoid duplicates.
 * - Returns an array of inserted/updated records (default columns: `id`).
 *
 * @example
 * await insertSkusBulk([
 *   { product_id: '...', sku: 'CH-HN101-R-CN', barcode: '628693...', created_by: userId },
 *   { product_id: '...', sku: 'CH-HN102-R-CA', barcode: '628693...', created_by: userId }
 * ], client);
 *
 * @param {Array<Object>} skus - SKU objects to insert.
 * @param {object} client - Active PG transaction client.
 * @returns {Promise<Array>} Inserted SKU rows (default: `{ id }` only).
 */
const insertSkusBulk = async (skus, client) => {
  if (!Array.isArray(skus) || skus.length === 0) return [];
  
  const context = 'sku-repository/insertSkusBulk';
  
  // Validate structure of input before processing
  if (!skus.every((s) => s.product_id && s.sku)) {
    throw AppError.validationError('Each SKU must include product_id and sku.');
  }
  
  const columns = [
    'product_id',
    'sku',
    'barcode',
    'language',
    'country_code',
    'market_region',
    'size_label',
    'description',
    'length_cm',
    'width_cm',
    'height_cm',
    'weight_g',
    'status_id',
    'created_by',
    'updated_at',
    'updated_by',
  ];
  
  // Convert objects into row arrays
  const rows = skus.map((s) => [
    s.product_id,
    s.sku,
    s.barcode,
    s.language,
    s.country_code,
    s.market_region,
    s.size_label,
    s.description,
    s.length_cm ?? null, // null → distinguish "unset" vs 0
    s.width_cm ?? null,
    s.height_cm ?? null,
    s.weight_g ?? null,
    s.status_id,
    s.created_by ?? null,
    null,
    null,
  ]);
  
  // Conflict handling (avoid duplicate SKU code)
  const conflictColumns = ['product_id', 'sku'];
  
  const updateStrategies = {
    description: 'overwrite', // Replace description if re-inserted
    updated_at: 'overwrite',  // Refresh timestamp
  };
  
  try {
    const result = await bulkInsert(
      'skus',
      columns,
      rows,
      conflictColumns,
      updateStrategies,
      client,
      { context },
      'id'
    );
    
    logSystemInfo('Successfully inserted or updated SKU records', {
      context,
      insertedCount: result.length,
      totalInput: skus.length,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to insert SKU records', {
      context,
      skuCount: skus.length,
    });
    
    throw AppError.databaseError('Failed to insert SKU records', {
      cause: error,
    });
  }
};

/**
 * Repository: Fetch a single SKU with minimal but complete base metadata.
 *
 * This function retrieves the core SKU information, including:
 *   - SKU fields (sku, barcode, dimensions, status, audit fields)
 *   - Related product metadata (name, brand, series, category)
 *   - Status lookup (SKU status name)
 *   - Created/updated user info (firstname/lastname)
 *
 * IMPORTANT:
 *   Does NOT include:
 *     - Pricing records
 *     - Compliance records
 *     - Images
 *   These are intentionally fetched separately to avoid performance-heavy joins.
 *
 * Performance:
 *   - Fast: uses PK filter `s.id = $1`
 *   - Joins limited to: products, status, and users
 *
 * Error Handling:
 *   - Returns `null` if SKU does not exist
 *   - Throws `AppError.databaseError` on DB failures
 *
 * @param {string} skuId - UUID of the SKU to fetch
 * @returns {Promise<Object|null>} SKU row with related metadata, or null if not found
 */
const getSkuDetailsById = async (skuId) => {
  const context = 'sku-repository/getSkuDetailsById';
  
  // Base lookup of SKU metadata only — keep this query light & fast
  const queryText = `
    SELECT
      s.id AS sku_id,
      s.product_id,
      p.name AS product_name,
      p.series AS product_series,
      p.brand AS product_brand,
      p.category AS product_category,
      s.sku,
      s.barcode,
      s.language,
      s.country_code,
      s.market_region,
      s.size_label,
      s.description AS sku_description,
      s.length_cm,
      s.width_cm,
      s.height_cm,
      s.weight_g,
      s.length_inch,
      s.width_inch,
      s.height_inch,
      s.weight_lb,
      s.status_id AS sku_status_id,
      st.name AS sku_status_name,
      s.status_date AS sku_status_date,
      s.created_at AS sku_created_at,
      s.updated_at AS sku_updated_at,
      s.created_by AS sku_created_by,
      s.updated_by AS sku_updated_by,
      u1.firstname AS created_by_firstname,
      u1.lastname AS created_by_lastname,
      u2.firstname AS updated_by_firstname,
      u2.lastname AS updated_by_lastname
    FROM skus s
    LEFT JOIN products p ON p.id = s.product_id
    LEFT JOIN status st ON st.id = s.status_id
    LEFT JOIN users u1 ON u1.id = s.created_by
    LEFT JOIN users u2 ON u2.id = s.updated_by
    WHERE s.id = $1
  `;
  
  try {
    const { rows } = await query(queryText, [skuId]);
    
    if (rows.length === 0) {
      // Not an error — SKU might simply not exist
      logSystemInfo('No SKU found for given ID', {
        context,
        skuId,
      });
      return null;
    }
    
    logSystemInfo('Fetched SKU detail successfully', {
      context,
      skuId,
    });
    
    return rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to fetch SKU detail', {
      context,
      skuId,
      error: error.message,
    });
    
    throw AppError.databaseError('Failed to fetch SKU detail', {
      context,
      details: error.message,
    });
  }
};

/**
 * Repository: Update SKU Status
 *
 * Updates the status of a SKU record by its ID. Automatically updates:
 *   - status_id
 *   - status_date
 *   - updated_at
 *   - updated_by
 *
 * Mirrors the product status update pattern to ensure consistent
 * audit behavior across ERP modules.
 *
 * @param {string} skuId - UUID of the SKU being updated
 * @param {string} statusId - UUID of the new status value
 * @param {string} userId - UUID of the user performing the update
 * @param {import('pg').PoolClient} client - Active DB client/transaction
 * @returns {Promise<{ id: string }>} Updated record identifier
 *
 * @throws {AppError} If update fails or SKU not found
 */
const updateSkuStatus = async (skuId, statusId, userId, client) => {
  const context = 'sku-repository/updateSkuStatus';
  
  try {
    const updates = {
      status_id: statusId,
      status_date: new Date(),
    };
    
    // Reuse generic updateById helper for consistency
    const result = await updateById('skus', skuId, updates, userId, client);
    
    logSystemInfo('Updated SKU status successfully', {
      context,
      skuId,
      statusId,
      updatedBy: userId,
    });
    
    return result; // { id: '...' }
  } catch (error) {
    logSystemException(error, 'Failed to update SKU status', {
      context,
      skuId,
      statusId,
      updatedBy: userId,
    });
    
    throw AppError.databaseError('Failed to update SKU status.', {
      context,
      cause: error.message,
    });
  }
};

module.exports = {
  getLastSku,
  getPaginatedSkuProductCards,
  getSkuLookup,
  getPaginatedSkus,
  checkBarcodeExists,
  checkSkuExists,
  insertSkusBulk,
  getSkuDetailsById,
  updateSkuStatus,
};

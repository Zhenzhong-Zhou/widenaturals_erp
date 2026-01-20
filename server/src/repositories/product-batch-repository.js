const { buildProductBatchFilter } = require('../utils/sql/build-product-batch-filters');
const { paginateResults } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Fetch paginated product batch records with optional filtering.
 *
 * Repository responsibility:
 * - Execute product batch operational SQL
 * - Apply normalized filter conditions
 * - Return flat rows for transformer-layer shaping
 *
 * Architectural notes:
 * - This is a DOMAIN-SPECIFIC list (product batches only)
 * - No inventory quantities, allocation, or QA logic here
 * - User display names are resolved via joins (read-only)
 *
 * Designed for:
 * - Product Batch list views (QA / Inventory / Manufacturing)
 * - Expiry monitoring
 * - Batch release tracking
 *
 * @param {Object} options
 * @param {Object} [options.filters]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {string} [options.sortBy='expiry_date']
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC']
 *
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
const getPaginatedProductBatches = async ({
                                            filters = {},
                                            page = 1,
                                            limit = 20,
                                            sortBy = 'expiry_date',
                                            sortOrder = 'ASC',
                                          }) => {
  const context = 'product-batch-repository/getPaginatedProductBatches';
  
  // ------------------------------------
  // 1. Build WHERE clause
  // ------------------------------------
  const { whereClause, params } = buildProductBatchFilter(filters);
  
  // ------------------------------------
  // 2. Base query (flat, explicit)
  // ------------------------------------
  const queryText = `
    SELECT
      pb.id,
      pb.lot_number,
      pb.sku_id,
      sk.sku                AS sku_code,
      sk.size_label,
      sk.country_code,
      p.id                  AS product_id,
      p.name                AS product_name,
      p.brand,
      p.category,
      pb.manufacturer_id,
      m.name                AS manufacturer_name,
      pb.manufacture_date,
      pb.expiry_date,
      pb.received_date,
      pb.initial_quantity,
      pb.status_id,
      bs.name               AS status_name,
      pb.status_date,
      pb.released_at,
      pb.released_by            AS released_by_id,
      rb.firstname              AS released_by_firstname,
      rb.lastname               AS released_by_lastname,
      pb.created_at,
      pb.created_by             AS created_by_id,
      cb.firstname              AS created_by_firstname,
      cb.lastname               AS created_by_lastname,
      pb.updated_at,
      pb.updated_by             AS updated_by_id,
      ub.firstname              AS updated_by_firstname,
      ub.lastname               AS updated_by_lastname
    FROM product_batches pb
    JOIN skus sk ON sk.id = pb.sku_id
    JOIN products p ON p.id = sk.product_id
    LEFT JOIN manufacturers m ON m.id = pb.manufacturer_id
    JOIN batch_status bs ON bs.id = pb.status_id
    LEFT JOIN users rb ON rb.id = pb.released_by
    LEFT JOIN users cb ON cb.id = pb.created_by
    LEFT JOIN users ub ON ub.id = pb.updated_by
    WHERE ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
  `;
  
  try {
    // ------------------------------------
    // 3. Execute paginated query
    // ------------------------------------
    const result = await paginateResults({
      dataQuery: queryText,
      params,
      page,
      limit,
      meta: { context },
    });
    
    logSystemInfo('Fetched paginated product batches successfully', {
      context,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
      count: result.data.length,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch product batches', {
      context,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    throw AppError.databaseError('Failed to fetch product batches.', {
      context,
    });
  }
};

module.exports = {
  getPaginatedProductBatches,
};

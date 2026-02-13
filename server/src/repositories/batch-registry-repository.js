const { query, paginateQueryByOffset, paginateResults } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const {
  buildBatchRegistryInventoryScopeFilter,
  buildBatchRegistryFilter,
} = require('../utils/sql/build-batch-registry-filters');

/**
 * Fetches a batch_registry row by its ID.
 *
 * @param {string} batchRegistryId - UUID of the batch_registry row.
 * @param {object} client - pg client or pool instance.
 * @returns {Promise<object|null>} - The row { id, batch_type } or null if not found.
 * @throws {AppError} - On query failure.
 */
const getBatchRegistryById = async (batchRegistryId, client) => {
  const sql = `
    SELECT id, batch_type
    FROM batch_registry
    WHERE id = $1
    LIMIT 1
  `;

  try {
    const { rows } = await query(sql, [batchRegistryId], client);
    return rows[0] || null;
  } catch (error) {
    logSystemException(error, 'Failed to fetch batch_registry by ID', {
      context: 'batch-registry-repository/getBatchRegistryById',
      batchRegistryId,
    });

    throw AppError.databaseError('Failed to fetch batch_registry entry', {
      details: error.message,
    });
  }
};

/**
 * Fetches paginated batch registry records for dropdowns using offset-based pagination.
 * Supports dynamic filtering, pagination, and optional exclusion of inventory batches.
 *
 * @param {object} options - Query options.
 * @param {object} options.filters - Filtering parameters.
 * @param {'product'|'packaging_material'} [filters.batchType] - Optional batch type.
 * @param {number} options.offset - Number of records to skip for pagination (default: 0).
 * @param {number} options.limit - Maximum number of records to return (default: 50).
 */
const getBatchRegistryLookup = async ({ filters, limit = 50, offset = 0 }) => {
  const tableName = 'batch_registry br';

  const joins = [
    'LEFT JOIN product_batches pb ON br.product_batch_id = pb.id',
    'LEFT JOIN skus s ON pb.sku_id = s.id',
    'LEFT JOIN products p ON s.product_id = p.id',
    'LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id',
  ];

  const { whereClause, params } = buildBatchRegistryInventoryScopeFilter(filters);

  const queryText = `
    SELECT
      br.id AS batch_registry_id,
      br.batch_type,
      pb.id AS product_batch_id,
      p.name AS product_name,
      p.brand,
      s.sku,
      s.country_code,
      s.size_label,
      pb.lot_number AS product_lot_number,
      pb.expiry_date AS product_expiry_date,
      pmb.id AS packaging_material_batch_id,
      pmb.lot_number AS material_lot_number,
      pmb.expiry_date AS material_expiry_date,
      pmb.material_snapshot_name,
      pmb.received_label_name
    FROM ${tableName}
    ${joins.join('\n')}
    WHERE ${whereClause}
  `;

  try {
    return await paginateQueryByOffset({
      tableName,
      joins,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 'br.registered_at',
      sortOrder: 'DESC',
      meta: { filters },
    });
  } catch (error) {
    logSystemException(error, 'Failed to fetch batch registry lookup', {
      context: 'batch-registry-repository/getBatchRegistryLookup',
      severity: 'error',
      metadata: { filters, limit, offset },
    });
    throw AppError.databaseError(
      'Unable to fetch batch registry lookup at this time.'
    );
  }
};

/**
 * Fetch paginated batch registry records with optional filtering.
 *
 * Repository responsibility:
 * - Execute the unified batch registry SQL
 * - Apply precomputed filter conditions
 * - Return flat, paginated rows for transformer-layer normalization
 *
 * Architectural notes:
 * - Batch polymorphism (product vs packaging) is NOT resolved here
 * - No grouping or domain interpretation occurs in this layer
 * - Pagination and counting are handled via raw SQL wrapping
 *
 * Designed for:
 * - Batch Registry list views
 * - Inventory linkage and audit exploration
 *
 * @param {Object} options
 * @param {Object} [options.filters] - Normalized filter criteria
 * @param {number} [options.page=1] - Page number (1-based)
 * @param {number} [options.limit=20] - Records per page
 *
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
const getPaginatedBatchRegistry = async ({
                                           filters = {},
                                           page = 1,
                                           limit = 20,
                                           sortBy = 'registered_at',
                                           sortOrder = 'DESC',
                                         }) => {
  const context = 'batch-registry-repository/getPaginatedBatchRegistry';
  
  // ------------------------------------
  // 1. Build WHERE clause from filters
  // ------------------------------------
  const { whereClause, params } = buildBatchRegistryFilter(filters);
  
  // ------------------------------------
  // 2. Construct base query (flat, explicit)
  // ------------------------------------
  // NOTE:
  // This SELECT intentionally includes identity-level joins only.
  // Quantities, inventory placement, QA records, and financial data
  // are excluded by design and must be fetched via domain-specific APIs.
  const queryText = `
    SELECT
      br.id                   AS batch_registry_id,
      br.batch_type,
      br.registered_at,
      br.registered_by,
      u_reg.firstname         AS registered_by_firstname,
      u_reg.lastname          AS registered_by_lastname,
      br.note,
      pb.id                   AS product_batch_id,
      pb.lot_number           AS product_lot_number,
      pb.expiry_date          AS product_expiry_date,
      pb.status_id            AS product_batch_status_id,
      bs_pb.name              AS product_batch_status_name,
      pb.status_date          AS product_batch_status_date,
      s.id                    AS sku_id,
      s.sku                   AS sku_code,
      p.id                    AS product_id,
      p.name                  AS product_name,
      m.id                    AS manufacturer_id,
      m.name                  AS manufacturer_name,
      pmb.id                  AS packaging_batch_id,
      pmb.lot_number          AS packaging_lot_number,
      pmb.received_label_name AS packaging_display_name,
      pmb.expiry_date         AS packaging_expiry_date,
      pmb.status_id           AS packaging_batch_status_id,
      bs_pmb.name             AS packaging_batch_status_name,
      pmb.status_date         AS packaging_batch_status_date,
      pm.id                   AS packaging_material_id,
      pm.code                 AS packaging_material_code,
      sup.id                  AS supplier_id,
      sup.name                AS supplier_name
    FROM batch_registry br
    LEFT JOIN users u_reg ON br.registered_by = u_reg.id
    LEFT JOIN product_batches pb ON br.product_batch_id = pb.id
    LEFT JOIN batch_status bs_pb ON pb.status_id = bs_pb.id
    LEFT JOIN skus s ON pb.sku_id = s.id
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN manufacturers m ON pb.manufacturer_id = m.id
    LEFT JOIN packaging_material_batches pmb
      ON br.packaging_material_batch_id = pmb.id
    LEFT JOIN batch_status bs_pmb ON pmb.status_id = bs_pmb.id
    LEFT JOIN packaging_material_suppliers pms
      ON pmb.packaging_material_supplier_id = pms.id
    LEFT JOIN packaging_materials pm ON pms.packaging_material_id = pm.id
    LEFT JOIN suppliers sup ON pms.supplier_id = sup.id
    WHERE ${whereClause}
    ORDER BY ${sortBy} ${sortOrder};
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
    
    // ------------------------------------
    // 4. Success logging
    // ------------------------------------
    logSystemInfo('Fetched paginated batch registry successfully', {
      context,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
      count: result.data.length,
    });
    
    return result;
  } catch (error) {
    // ------------------------------------
    // 5. Error handling
    // ------------------------------------
    logSystemException(error, 'Failed to fetch paginated batch registry', {
      context,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    throw AppError.databaseError('Failed to fetch batch registry.', {
      context,
    });
  }
};

module.exports = {
  getBatchRegistryById,
  getBatchRegistryLookup,
  getPaginatedBatchRegistry,
};

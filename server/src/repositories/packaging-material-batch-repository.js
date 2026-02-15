const {
  buildPackagingMaterialBatchFilter,
} = require('../utils/sql/build-packaging-material-batch-filters');
const { paginateResults } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Fetch paginated packaging material batch records with optional filtering.
 *
 * Repository responsibility:
 * - Execute packaging material batch SQL
 * - Apply normalized filter conditions
 * - Return flat rows for transformer shaping
 *
 * Architectural notes:
 * - Snapshot-first (batch identity is historical, not master-driven)
 * - No inventory, allocation, or costing logic beyond stored values
 * - packaging_materials is reference-only
 *
 * Designed for:
 * - Packaging intake & batch registry
 * - QA review
 * - Expiry monitoring
 *
 * @param {Object} options
 * @param {Object} [options.filters]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {string} [options.sortBy='received_at']
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']
 *
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
const getPaginatedPackagingMaterialBatches = async ({
  filters = {},
  page = 1,
  limit = 20,
  sortBy = 'received_at',
  sortOrder = 'DESC',
}) => {
  const context =
    'packaging-material-batch-repository/getPaginatedPackagingMaterialBatches';

  // ------------------------------------
  // 1. Build WHERE clause
  // ------------------------------------
  const { whereClause, params } = buildPackagingMaterialBatchFilter(filters);

  // ------------------------------------
  // 2. Base query (flat, snapshot-first)
  // ------------------------------------
  const queryText = `
    SELECT
      pmb.id,
      pmb.lot_number,
      pmb.quantity,
      pmb.unit,
      pmb.manufacture_date,
      pmb.expiry_date,
      pmb.received_at,
      pmb.received_by       AS received_by_id,
      rb.firstname          AS received_by_firstname,
      rb.lastname           AS received_by_lastname,
      pmb.material_snapshot_name,
      pmb.received_label_name,
      pmb.unit_cost,
      pmb.currency,
      pmb.exchange_rate,
      pmb.total_cost,
      pmb.status_id,
      bs.name               AS status_name,
      pmb.status_date,
      pm.id                 AS packaging_material_id,
      pm.code               AS packaging_material_code,
      pm.category           AS packaging_material_category,
      s.id                  AS supplier_id,
      s.name                AS supplier_name,
      pms.is_preferred,
      pms.lead_time_days,
      pmb.created_at,
      pmb.created_by        AS created_by_id,
      cb.firstname          AS created_by_firstname,
      cb.lastname           AS created_by_lastname,
      pmb.updated_at,
      pmb.updated_by        AS updated_by_id,
      ub.firstname          AS updated_by_firstname,
      ub.lastname           AS updated_by_lastname
    FROM packaging_material_batches pmb
    JOIN packaging_material_suppliers pms
      ON pmb.packaging_material_supplier_id = pms.id
    JOIN packaging_materials pm ON pms.packaging_material_id = pm.id
    JOIN suppliers s ON pms.supplier_id = s.id
    JOIN batch_status bs ON bs.id = pmb.status_id
    LEFT JOIN users rb ON rb.id = pmb.received_by
    LEFT JOIN users cb ON cb.id = pmb.created_by
    LEFT JOIN users ub ON ub.id = pmb.updated_by
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

    logSystemInfo('Fetched paginated packaging material batches successfully', {
      context,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
      count: result.data.length,
    });

    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch packaging material batches', {
      context,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });

    throw AppError.databaseError(
      'Failed to fetch packaging material batches.',
      { context }
    );
  }
};

module.exports = {
  getPaginatedPackagingMaterialBatches,
};

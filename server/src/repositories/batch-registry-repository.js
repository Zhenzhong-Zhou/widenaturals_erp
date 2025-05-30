const { query, paginateQuery } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');
const { buildBatchRegistryWhereClause } = require('../utils/sql/build-batch-registry-filters');

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
 * Fetches batch registry records for dropdowns.
 * Supports dynamic filtering, pagination, and optional exclusion of inventory batches.
 *
 * @param {Object} options - Query options.
 * @param {Object} options.filters - Filtering parameters.
 * @param {number} [options.limit=50] - Number of records to fetch.
 * @param {number} options.page - Current page number (1-based)
 * @returns {Promise<Object[]>} - Array of dropdown records.
 */
const getBatchRegistryDropdown = async ({ filters, limit = 50, page = 1 }) => {
  const tableName = 'batch_registry br';
  
  const joins = [
    'LEFT JOIN product_batches pb ON br.product_batch_id = pb.id',
    'LEFT JOIN skus s ON pb.sku_id = s.id',
    'LEFT JOIN products p ON s.product_id = p.id',
    'LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id',
  ];
  
  const { whereClause, params } = buildBatchRegistryWhereClause(filters);
  
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
    return await paginateQuery({
      tableName,
      joins,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy: 'br.registered_at',
      sortOrder: 'DESC',
      meta: { filters },
    });
  } catch (error) {
    logSystemException(error, 'Failed to fetch batch registry dropdown', {
      context: 'batch-registry-repository/getBatchRegistryDropdown',
      severity: 'error',
      metadata: { filters, limit, page },
    });
    throw AppError.databaseError('Unable to fetch batch registry dropdown at this time.');
  }
};

module.exports = {
  getBatchRegistryById,
  getBatchRegistryDropdown
};

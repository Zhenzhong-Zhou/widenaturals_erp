const {
  query,
  paginateQueryByOffset,
  paginateResults, bulkInsert,
} = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const {
  buildBatchRegistryInventoryScopeFilter,
  buildBatchRegistryFilter,
} = require('../utils/sql/build-batch-registry-filters');

/**
 * Fetch a batch_registry record by its ID.
 *
 * Retrieves the registry entry used to link product or packaging
 * batches to lifecycle activity tracking.
 *
 * @param {string} batchRegistryId
 * UUID of the batch_registry row.
 *
 * @param {import('pg').PoolClient} client
 * Active PostgreSQL transaction client or pool instance.
 *
 * @returns {Promise<{
 *   id: string,
 *   batch_type: 'product' | 'packaging_material',
 *   note: string | null
 * } | null>}
 * Returns the registry record or null if no entry exists.
 *
 * @throws {AppError}
 * Thrown if the database query fails.
 */
const getBatchRegistryById = async (batchRegistryId, client) => {
  const sql = `
    SELECT id, batch_type, note
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

  const { whereClause, params } =
    buildBatchRegistryInventoryScopeFilter(filters);

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

/**
 * Bulk insert batch registry records.
 *
 * This repository function inserts multiple records into the `batch_registry`
 * table, which tracks when batches are registered in the system.
 *
 * Each registry entry references either a product batch or a packaging
 * material batch depending on the `batch_type`.
 *
 * Conflict Handling:
 * - Prevents duplicate registry entries per batch.
 * - If a conflict occurs, only the `note` field may be updated.
 *
 * Validation:
 * - Ensures required identifiers exist based on `batch_type`.
 * - Ensures all records in the request share the same `batch_type`.
 *
 * Performance:
 * - Uses a single bulk insert query for efficiency.
 * - Suitable for typical ERP batch registration operations.
 *
 * @async
 * @function insertBatchRegistryBulk
 *
 * @param {Array<Object>} registries
 * List of batch registry records.
 *
 * @param {string} registries[].batch_type
 * Batch type: `product` or `packaging_material`.
 *
 * @param {string|null} registries[].product_batch_id
 * Product batch identifier (required when batch_type = `product`).
 *
 * @param {string|null} registries[].packaging_material_batch_id
 * Packaging material batch identifier (required when batch_type = `packaging_material`).
 *
 * @param {string|null} registries[].registered_by
 * User who registered the batch.
 *
 * @param {string|null} registries[].note
 * Optional registry note.
 *
 * @param {Object|null} [client]
 * Optional PostgreSQL transaction client.
 *
 * @returns {Promise<Array<{id: string}>>}
 * Returns inserted registry records containing generated IDs.
 *
 * @throws {AppError}
 * Throws validation or database errors if the operation fails.
 */
const insertBatchRegistryBulk = async (registries, client) => {
  if (!Array.isArray(registries) || registries.length === 0) return [];
  
  const context = 'batch-registry-repository/insertBatchRegistryBulk';
  
  // Ensure all records share the same batch type
  const batchType = registries[0].batch_type;
  
  if (!registries.every((r) => r.batch_type === batchType)) {
    throw AppError.validationError(
      'Batch registry bulk insert must contain a single batch_type.'
    );
  }
  
  const columns = [
    'batch_type',
    'product_batch_id',
    'packaging_material_batch_id',
    'registered_by',
    'updated_at',
    'updated_by',
    'note',
  ];
  
  const rows = registries.map((r) => {
    // Defensive validation for required identifiers
    if (r.batch_type === 'product' && !r.product_batch_id) {
      throw AppError.validationError('Invalid batch registry request.');
    }
    
    if (
      r.batch_type === 'packaging_material' &&
      !r.packaging_material_batch_id
    ) {
      throw AppError.validationError('Invalid batch registry request.');
    }
    
    return [
      r.batch_type,
      r.product_batch_id ?? null,
      r.packaging_material_batch_id ?? null,
      r.registered_by ?? null,
      null,
      null,
      r.note ?? null,
    ];
  });
  
  // Determine conflict column based on batch type
  const conflictColumns =
    batchType === 'product'
      ? ['product_batch_id']
      : ['packaging_material_batch_id'];
  
  const updateStrategies = {
    note: 'overwrite',
  };
  
  try {
    const result = await bulkInsert(
      'batch_registry',
      columns,
      rows,
      conflictColumns,
      updateStrategies,
      client,
      { context },
      'id'
    );
    
    logSystemInfo('Successfully inserted batch registry records', {
      context,
      insertedCount: result.length,
      totalInput: registries.length,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to insert batch registry records', {
      context,
      registryCount: registries.length,
    });
    
    throw AppError.databaseError('Failed to insert batch registry records', {
      cause: error,
    });
  }
};

/**
 * Update the note field of a batch_registry record.
 *
 * This repository function performs a minimal update to the
 * `batch_registry` table and records audit metadata
 * (`updated_by`, `updated_at`).
 *
 * The caller is responsible for transaction handling.
 *
 * @param {Object} params
 * @param {string} params.id
 *   UUID of the batch_registry row to update.
 *
 * @param {string|null|undefined} params.note
 *   New note value. If undefined, it will be normalized to null.
 *
 * @param {string|null|undefined} params.updatedBy
 *   User ID performing the update.
 *
 * @param {import('pg').PoolClient} client
 *   Active PostgreSQL transaction client.
 *
 * @returns {Promise<{ id: string }>}
 *   The updated batch_registry identifier.
 *
 * @throws {AppError}
 *   Throws `notFoundError` if the record does not exist,
 *   or `databaseError` if the query fails.
 */
const updateBatchRegistryNoteById = async (
  { id, note, updatedBy },
  client
) => {
  const context = 'batch-registry-repository/updateBatchRegistryNoteById';
  
  //------------------------------------------------------------
  // Update registry note and audit metadata
  //------------------------------------------------------------
  const queryText = `
    UPDATE batch_registry
      SET
        note = $2,
        updated_by = $3,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id;
  `;
  
  try {
    const result = await query(
      queryText,
      [
        id,
        // Normalize undefined to NULL for consistent DB storage
        note ?? null,
        updatedBy ?? null,
      ],
      client
    );
    
    //------------------------------------------------------------
    // Ensure the registry record exists
    //------------------------------------------------------------
    if (result.rowCount === 0) {
      throw AppError.notFoundError('Batch registry record not found.');
    }
    
    logSystemInfo('Successfully updated batch registry note', {
      context,
      batchRegistryId: id,
    });
    
    return result.rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to update batch registry note', {
      context,
      batchRegistryId: id,
    });
    
    throw AppError.databaseError('Failed to update batch registry note', {
      cause: error,
    });
  }
};

module.exports = {
  getBatchRegistryById,
  getBatchRegistryLookup,
  getPaginatedBatchRegistry,
  insertBatchRegistryBulk,
  updateBatchRegistryNoteById,
};

const {
  buildPackagingMaterialBatchFilter,
} = require('../utils/sql/build-packaging-material-batch-filters');
const { paginateResults, bulkInsert, updateById, query } = require('../database/db');
const {
  logSystemInfo,
  logSystemException
} = require('../utils/system-logger');
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

/**
 * Bulk insert or update packaging material batch records.
 *
 * This repository function inserts multiple packaging material batch records
 * into the `packaging_material_batches` table using the shared `bulkInsert`
 * utility. If a batch already exists (based on the unique constraint),
 * selected fields will be updated according to defined update strategies.
 *
 * Conflict Handling:
 * - A conflict is detected using (`packaging_material_supplier_id`, `lot_number`).
 * - When a conflict occurs, mutable fields such as cost, quantity, and status
 *   are updated while other fields remain unchanged.
 *
 * Performance:
 * - Uses a single bulk insert operation to minimize database round-trips.
 * - Suitable for ERP workflows such as supplier batch imports or inventory
 *   reconciliation where multiple batches are processed at once.
 *
 * Logging:
 * - Emits a system info log on successful insert/update.
 * - Emits a system exception log if the operation fails.
 *
 * @async
 * @function insertPackagingMaterialBatchesBulk
 *
 * @param {Array<Object>} packagingMaterialBatches
 * List of packaging material batch records.
 *
 * @param {string} packagingMaterialBatches[].packaging_material_supplier_id
 * Supplier reference for the packaging material.
 *
 * @param {string} packagingMaterialBatches[].lot_number
 * Supplier lot number for the material batch.
 *
 * @param {string|null} [packagingMaterialBatches[].material_snapshot_name]
 * Snapshot name of the material at the time of receipt.
 *
 * @param {string|null} [packagingMaterialBatches[].received_label_name]
 * Label name used on the received packaging material.
 *
 * @param {number} packagingMaterialBatches[].quantity
 * Quantity received in the batch.
 *
 * @param {string} packagingMaterialBatches[].unit
 * Unit of measurement (e.g. `pcs`, `kg`, `roll`).
 *
 * @param {Date|string|null} [packagingMaterialBatches[].manufacture_date]
 * Manufacturing date if provided by supplier.
 *
 * @param {Date|string|null} [packagingMaterialBatches[].expiry_date]
 * Expiry date if applicable.
 *
 * @param {number|null} [packagingMaterialBatches[].unit_cost]
 * Cost per unit of the material.
 *
 * @param {string|null} [packagingMaterialBatches[].currency]
 * Currency used for the cost.
 *
 * @param {number|null} [packagingMaterialBatches[].exchange_rate]
 * Exchange rate applied if foreign currency is used.
 *
 * @param {number|null} [packagingMaterialBatches[].total_cost]
 * Total cost calculated for the batch.
 *
 * @param {string} packagingMaterialBatches[].status_id
 * Current status identifier for the batch.
 *
 * @param {Date|string|null} [packagingMaterialBatches[].status_date]
 * Timestamp for the status change.
 *
 * @param {Date|string|null} [packagingMaterialBatches[].received_at]
 * Timestamp when the material was received.
 *
 * @param {string|null} [packagingMaterialBatches[].received_by]
 * User who received the batch.
 *
 * @param {string|null} [packagingMaterialBatches[].created_by]
 * User who created the record.
 *
 * @param {Object|null} [client]
 * Optional PostgreSQL transaction client.
 *
 * @param {Object} [meta]
 * Optional metadata passed to logging or query helpers.
 *
 * @returns {Promise<Array<Object>>}
 * Returns inserted or updated batch records.
 *
 * @throws {AppError}
 * Throws database error if insertion fails.
 */
const insertPackagingMaterialBatchesBulk = async (
  packagingMaterialBatches,
  client,
  meta = {}
) => {
  if (!Array.isArray(packagingMaterialBatches) || packagingMaterialBatches.length === 0)
    return [];
  
  const context =
    'packaging-material-batch-repository/insertPackagingMaterialBatchesBulk';
  
  const columns = [
    'packaging_material_supplier_id',
    'lot_number',
    'material_snapshot_name',
    'received_label_name',
    'quantity',
    'unit',
    'manufacture_date',
    'expiry_date',
    'unit_cost',
    'currency',
    'exchange_rate',
    'total_cost',
    'status_id',
    'received_at',
    'received_by',
    'created_by',
    'updated_at',
    'updated_by',
  ];
  
  const rows = packagingMaterialBatches.map((batch) => [
    batch.packaging_material_supplier_id,
    batch.lot_number,
    batch.material_snapshot_name ?? null,
    batch.received_label_name ?? null,
    batch.quantity,
    batch.unit,
    batch.manufacture_date ?? null,
    batch.expiry_date ?? null,
    batch.unit_cost ?? null,
    batch.currency ?? null,
    batch.exchange_rate ?? null,
    batch.total_cost ?? null,
    batch.status_id,
    null, // received_at (not set during creation)
    null, // received_by
    batch.created_by ?? null,
    null, // updated_at handled by update strategy
    null, // updated_by
  ]);
  
  // Prevent duplicate batches for the same supplier lot
  const conflictColumns = ['packaging_material_supplier_id', 'lot_number'];
  
  // Define field update behavior during conflicts
  const updateStrategies = {
    material_snapshot_name: 'overwrite',
    received_label_name: 'overwrite',
    quantity: 'overwrite',
    unit_cost: 'overwrite',
    exchange_rate: 'overwrite',
    total_cost: 'overwrite',
    status_id: 'overwrite',
    status_date: 'overwrite',
    updated_at: 'overwrite',
  };
  
  try {
    const result = await bulkInsert(
      'packaging_material_batches',
      columns,
      rows,
      conflictColumns,
      updateStrategies,
      client,
      { context, ...meta },
      '*'
    );
    
    logSystemInfo('Successfully inserted or updated packaging material batches', {
      context,
      insertedCount: result.length,
      totalInput: packagingMaterialBatches.length,
    });
    
    return result;
  } catch (error) {
    logSystemException(
      error,
      'Failed to insert packaging material batch records',
      {
        context,
        batchCount: packagingMaterialBatches.length,
      }
    );
    
    throw AppError.databaseError(
      'Failed to insert packaging material batch records',
      { cause: error }
    );
  }
};

/**
 * Fetch minimal packaging material batch data required for lifecycle workflows.
 *
 * @param {string} batchId
 * @param {import('pg').PoolClient} client
 *
 * @returns {Promise<{
 *   id: string,
 *   status_id: string,
 *   status_name: string,
 *   batch_registry_id: string|null
 * } | null>}
 */
const getPackagingMaterialBatchById = async (batchId, client) => {
  const context = 'packaging-material-batch-repository/getPackagingMaterialBatchById';
  
  const queryText = `
    SELECT
      pmb.id,
      pmb.status_id,
      bs.name AS status_name,
      br.id AS batch_registry_id
    FROM packaging_material_batches pmb
    JOIN batch_status bs
      ON bs.id = pmb.status_id
    LEFT JOIN batch_registry br
      ON br.packaging_material_batch_id = pmb.id
    WHERE pmb.id = $1
  `;
  
  try {
    const { rows } = await query(queryText, [batchId], client);
    
    if (rows.length === 0) {
      logSystemInfo('No packaging material batch found for given ID', {
        context,
        batchId,
      });
      
      return null;
    }
    
    logSystemInfo('Fetched packaging material batch successfully', {
      context,
      batchId,
    });
    
    return rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to fetch packaging material batch', {
      context,
      batchId,
      error: error.message,
    });
    
    throw AppError.databaseError('Failed to fetch packaging material batch', {
      details: {
        context,
        message: error.message,
      }
    });
  }
};

/**
 * Update packaging material batch metadata.
 *
 * This function performs a partial update on the
 * `packaging_material_batches` table. Only fields provided
 * in the params object will be updated.
 *
 * @param {Object} params
 * @param {string} params.batchId
 * @param {string|null} [params.packagingMaterialSupplierId]
 * @param {string|null} [params.lotNumber]
 * @param {string|null} [params.materialSnapshotName]
 * @param {string|null} [params.receivedLabelName]
 * @param {number|null} [params.quantity]
 * @param {string|null} [params.unit]
 * @param {string|null} [params.manufactureDate]
 * @param {string|null} [params.expiryDate]
 * @param {number|null} [params.unitCost]
 * @param {string|null} [params.currency]
 * @param {number|null} [params.exchangeRate]
 * @param {number|null} [params.totalCost]
 * @param {string|null} [params.statusId]
 * @param {string|null} [params.receivedAt]
 * @param {string|null} [params.receivedBy]
 * @param {string} params.updatedBy
 * @param {import('pg').PoolClient} client
 *
 * @returns {Promise<Object>}
 */
const updatePackagingMaterialBatch = async (params, client) => {
  const context = 'packaging-material-batch-repository/updatePackagingMaterialBatch';
  
  const {
    batchId,
    packagingMaterialSupplierId,
    lotNumber,
    materialSnapshotName,
    receivedLabelName,
    quantity,
    unit,
    manufactureDate,
    expiryDate,
    unitCost,
    currency,
    exchangeRate,
    totalCost,
    statusId,
    receivedAt,
    receivedBy,
    updatedBy,
  } = params;
  
  const updates = {
    packaging_material_supplier_id: packagingMaterialSupplierId,
    lot_number: lotNumber,
    material_snapshot_name: materialSnapshotName,
    received_label_name: receivedLabelName,
    quantity,
    unit,
    manufacture_date: manufactureDate,
    expiry_date: expiryDate,
    unit_cost: unitCost,
    currency,
    exchange_rate: exchangeRate,
    total_cost: totalCost,
    status_id: statusId,
    received_at: receivedAt,
    received_by: receivedBy,
  };
  
  try {
    return await updateById(
      'packaging_material_batches',
      batchId,
      updates,
      updatedBy,
      client
    );
  } catch (error) {
    logSystemException(error, 'Failed to update packaging material batch', {
      context,
      batchId,
    });
    
    throw AppError.databaseError('Failed to update packaging material batch', {
      context,
      cause: error,
    });
  }
};

module.exports = {
  getPaginatedPackagingMaterialBatches,
  insertPackagingMaterialBatchesBulk,
  getPackagingMaterialBatchById,
  updatePackagingMaterialBatch,
};

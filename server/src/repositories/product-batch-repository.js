const {
  buildProductBatchFilter,
} = require('../utils/sql/build-product-batch-filters');
const { paginateResults, bulkInsert, updateById, query } = require('../database/db');
const {
  logSystemInfo,
  logSystemException,
} = require('../utils/system-logger');
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

/**
 * Bulk insert or update product batch records.
 *
 * This repository function inserts multiple product batch records into the
 * `product_batches` table using the shared `bulkInsert` utility.
 *
 * If a conflict occurs on the unique constraint (`lot_number`, `sku_id`),
 * the existing record is updated according to the configured update strategies.
 *
 * The function is designed for batch registry workflows where product lots
 * are created or synchronized during inbound inventory, manufacturing imports,
 * or batch reconciliation processes.
 *
 * Conflict Resolution:
 * - Immutable fields such as `manufacturer_id`, `received_date`, and release
 *   information are preserved when conflicts occur.
 * - Mutable fields such as `notes`, `status_id`, and `status_date` may be updated.
 *
 * Performance:
 * - Uses a single bulk insert operation to minimize database round-trips.
 * - Suitable for typical ERP batch operations where the number of lots per
 *   request is relatively small.
 *
 * Logging:
 * - Emits a system info log upon successful insertion or update.
 * - Emits a system exception log if the operation fails.
 *
 * @async
 * @function
 *
 * @param {Array<Object>} productBatches - List of product batch records to insert.
 * @param {string} productBatches[].lot_number - Manufacturer lot number.
 * @param {string} productBatches[].sku_id - Associated SKU identifier.
 * @param {string} productBatches[].manufacturer_id - Manufacturer responsible for the batch.
 * @param {Date|string} productBatches[].manufacture_date - Batch manufacturing date.
 * @param {Date|string} productBatches[].expiry_date - Batch expiry date.
 * @param {number} productBatches[].initial_quantity - Initial quantity received.
 * @param {string|null} [productBatches[].notes] - Optional notes associated with the batch.
 * @param {string} productBatches[].status_id - Current batch status identifier.
 * @param {string|null} [productBatches[].created_by] - User responsible for batch creation.
 *
 * @param {Object|null} [client] - Optional PostgreSQL transaction client.
 *
 * @returns {Promise<Array<Object>>}
 * Returns the inserted or updated batch records.
 *
 * @throws {AppError}
 * Throws `AppError.databaseError` if the database operation fails.
 */
const insertProductBatchesBulk = async (productBatches, client) => {
  if (!Array.isArray(productBatches) || productBatches.length === 0) return [];
  
  const context = 'product-batch-repository/insertProductBatchesBulk';
  
  const columns = [
    'lot_number',
    'sku_id',
    'manufacturer_id',
    'manufacture_date',
    'expiry_date',
    'received_at',
    'received_by',
    'initial_quantity',
    'notes',
    'status_id',
    'released_at',
    'released_by',
    'released_by_manufacturer_id',
    'created_by',
    'updated_at',
    'updated_by',
  ];
  
  const rows = productBatches.map((batch) => [
    batch.lot_number,
    batch.sku_id,
    batch.manufacturer_id,
    batch.manufacture_date,
    batch.expiry_date,
    null, // received_at (not set during creation)
    null, // received_by
    batch.initial_quantity,
    batch.notes ?? null,
    batch.status_id,
    null, // released_at (not set during creation)
    null, // released_by
    null, // released_by_manufacturer_id
    batch.created_by ?? null,
    null, // updated_at handled by DB or bulkInsert
    null, // updated_by
  ]);
  
  // Prevent duplicate batches for the same SKU
  const conflictColumns = ['lot_number', 'sku_id'];
  
  // Define field-level update behavior during conflict resolution
  const updateStrategies = {
    manufacturer_id: 'preserve',
    received_at: 'preserve',
    notes: 'overwrite',
    status_id: 'overwrite',
    released_at: 'preserve',
    released_by: 'preserve',
    released_by_manufacturer_id: 'preserve',
    updated_at: 'overwrite',
  };
  
  try {
    const result = await bulkInsert(
      'product_batches',
      columns,
      rows,
      conflictColumns,
      updateStrategies,
      client,
      { context },
      '*'
    );
    
    logSystemInfo('Successfully inserted or updated product batch records', {
      context,
      insertedCount: result.length,
      totalInput: productBatches.length,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to insert product batch records', {
      context,
      batchCount: productBatches.length,
    });
    
    throw AppError.databaseError('Failed to insert product batch records', {
      details: error,
    });
  }
};

/**
 * Fetch a product batch record by ID.
 *
 * Returns the batch with lifecycle status and registry linkage.
 * This record provides enough information for lifecycle workflows,
 * metadata updates, and batch activity logging.
 *
 * @param {string} batchId
 * Product batch identifier.
 *
 * @param {import('pg').PoolClient} client
 * Active transaction client.
 *
 * @returns {Promise<{
 *   id: string,
 *   lot_number: string|null,
 *   sku_id: string,
 *   manufacturer_id: string|null,
 *   manufacture_date: Date|null,
 *   expiry_date: Date|null,
 *   received_at: Date|null,
 *   received_by: string|null,
 *   initial_quantity: number|null,
 *   notes: string|null,
 *   status_id: string,
 *   status_name: string,
 *   status_date: Date|null,
 *   released_at: Date|null,
 *   released_by: string|null,
 *   released_by_manufacturer_id: string|null,
 *   batch_registry_id: string|null
 * } | null>}
 */
const getProductBatchById = async (batchId, client) => {
  const context = 'product-batch-repository/getProductBatchById';
  
  const queryText = `
    SELECT
      pb.id,
      pb.lot_number,
      pb.sku_id,
      pb.manufacturer_id,
      pb.manufacture_date,
      pb.expiry_date,
      pb.received_at,
      pb.received_by,
      pb.initial_quantity,
      pb.notes,
      pb.status_id,
      bs.name AS status_name,
      pb.status_date,
      pb.released_at,
      pb.released_by,
      pb.released_by_manufacturer_id,
      br.id AS batch_registry_id
    FROM product_batches pb
    JOIN batch_status bs
      ON bs.id = pb.status_id
    LEFT JOIN batch_registry br
      ON br.product_batch_id = pb.id
    WHERE pb.id = $1
  `;
  
  try {
    const { rows } = await query(queryText, [batchId], client);
    
    if (rows.length === 0) {
      logSystemInfo('No product batch found for given ID', {
        context,
        batchId,
      });
      return null;
    }
    
    logSystemInfo('Fetched product batch successfully', {
      context,
      batchId,
    });
    
    return rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to fetch product batch', {
      context,
      batchId,
      error: error.message,
    });
    
    throw AppError.databaseError('Failed to fetch product batch', {
      details: {
        context,
        message: error.message,
      }
    });
  }
};

/**
 * Update metadata of a product batch.
 *
 * Performs a partial update on the `product_batches` table.
 * Only fields provided in the `params` object will be included
 * in the update statement.
 *
 * This repository function does not contain business logic.
 * Lifecycle rules and validation are handled in the service layer.
 *
 * @param {Object} params
 *
 * @param {string} params.batchId
 * Unique identifier of the batch to update.
 *
 * @param {string|null} [params.lot_number]
 * Batch lot number assigned by the manufacturer.
 *
 * @param {string|null} [params.manufacturer_id]
 * Manufacturer responsible for the batch.
 *
 * @param {string|null} [params.manufacture_date]
 * Date when the batch was produced.
 *
 * @param {string|null} [params.expiry_date]
 * Expiration date of the batch.
 *
 * @param {Date|null} [params.received_at]
 * Timestamp indicating when the batch was received
 * into warehouse inventory.
 *
 * @param {string|null} [params.received_by]
 * Internal user who recorded the batch intake.
 *
 * @param {number|null} [params.initial_quantity]
 * Initial quantity recorded for the batch.
 *
 * @param {string|null} [params.notes]
 * Optional notes or operational comments.
 *
 * @param {string|null} [params.status_id]
 * Lifecycle status identifier of the batch.
 *
 * @param {string|null} [params.released_by]
 * Internal user responsible for releasing the batch.
 *
 * @param {string|null} [params.released_by_manufacturer_id]
 * Manufacturer responsible for approving the batch release.
 *
 * @param {string} params.updatedBy
 * Identifier of the user performing the update.
 *
 * @param {import('pg').PoolClient} client
 * Database client used for transactional execution.
 *
 * @returns {Promise<Object>}
 * Updated product batch record.
 */
const updateProductBatch = async (params, client) => {
  const context = 'product-batch-repository/updateProductBatch';
  
  const {
    batchId,
    lot_number,
    manufacturer_id,
    manufacture_date,
    expiry_date,
    received_at,
    received_by,
    initial_quantity,
    notes,
    status_id,
    released_by,
    released_by_manufacturer_id,
    updatedBy,
  } = params;
  
  // Only defined fields will be applied by updateById
  const updates = {
    lot_number,
    manufacturer_id,
    manufacture_date,
    expiry_date,
    received_at,
    received_by,
    initial_quantity,
    notes,
    status_id,
    released_by,
    released_by_manufacturer_id,
  };
  
  try {
    return await updateById(
      'product_batches',
      batchId,
      updates,
      updatedBy,
      client
    );
  } catch (error) {
    logSystemException(error, 'Failed to update product batch', {
      context,
      batchId,
    });
    
    throw AppError.databaseError('Failed to update product batch', {
      context,
      cause: error,
    });
  }
};

module.exports = {
  getPaginatedProductBatches,
  insertProductBatchesBulk,
  getProductBatchById,
  updateProductBatch,
};

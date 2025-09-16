const { bulkInsert } = require('../database/db');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Inserts or updates shipment batch records in bulk.
 *
 * Business rules:
 *  - On conflict (`shipment_id`, `batch_id`), the following strategies apply:
 *    - `quantity_shipped`: incremented (sums quantities if the same batch is reinserted).
 *    - `notes`: merged using text concatenation with timestamp prefix.
 *    - `created_at`: overwritten to reflect the most recent insert (acts as "last seen" timestamp).
 *
 * Usage:
 *  - Call during fulfillment when recording which batches were shipped for a shipment.
 *  - Optimized to perform a single bulk insert/update round-trip.
 *
 * @async
 * @function
 * @param {Array<{
 *   shipment_id: string,
 *   batch_id: string,
 *   quantity_shipped: number,
 *   notes?: string | null,
 *   created_by?: string | null
 * }>} shipmentBatches - Array of shipment batch records
 * @param {import('pg').PoolClient} client - Active PostgreSQL transaction client
 *
 * @returns {Promise<Array<{ id: string }>>} Array of inserted or updated rows, returning only IDs
 *
 * @throws {AppError} Throws `AppError.databaseError` if the insert/update fails
 *
 * @example
 * await insertShipmentBatchesBulk([
 *   { shipment_id: "shp-001", batch_id: "batch-123", quantity_shipped: 10, notes: "Initial fulfillment" },
 *   { shipment_id: "shp-001", batch_id: "batch-123", quantity_shipped: 5, notes: "Extra allocation" }
 * ], client);
 * // Merges into one record with quantity_shipped = 15 and merged notes
 */
const insertShipmentBatchesBulk = async (shipmentBatches, client) => {
  if (!Array.isArray(shipmentBatches) || shipmentBatches.length === 0) return [];
  
  const columns = [
    'shipment_id',
    'batch_id',
    'quantity_shipped',
    'notes',
    'created_by',
  ];
  
  const rows = shipmentBatches.map((b) => [
    b.shipment_id,
    b.batch_id,
    b.quantity_shipped,
    b.notes ?? null,
    b.created_by ?? null,
  ]);
  
  const conflictColumns = ['shipment_id', 'batch_id'];
  
  const updateStrategies = {
    quantity_shipped: 'add',      // Sum quantities if same shipment/batch
    notes: 'merge_text',               // Merge notes text
    created_at: 'overwrite',      // Keep latest creation time (optional)
  };
  
  try {
    const result = await bulkInsert(
      'shipment_batches',
      columns,
      rows,
      conflictColumns,
      updateStrategies,
      client,
      { context: 'shipment-batch-repository/insertShipmentBatchesBulk' },
      'id'
    );
    
    logSystemInfo('Successfully inserted or updated shipment batches', {
      context: 'shipment-batches-repository/insertShipmentBatchesBulk',
      insertedCount: result.length,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to insert shipment batches', {
      context: 'shipment-batches-repository/insertShipmentBatchesBulk',
      shipmentBatchCount: shipmentBatches.length,
    });
    
    throw AppError.databaseError('Failed to insert shipment batches', {
      cause: error,
    });
  }
};

module.exports = {
  insertShipmentBatchesBulk,
};

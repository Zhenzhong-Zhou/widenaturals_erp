/**
 * @file shipment-batch-repository.js
 * @description Database access layer for shipment batch records.
 *
 * Exports:
 *  - insertShipmentBatchesBulk — bulk upsert with conflict resolution
 */

'use strict';

const { bulkInsert } = require('../database/db');
const { validateBulkInsertRows } = require('../utils/validation/bulk-insert-row-validator');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logBulkInsertError } = require('../utils/db-logger');
const {
  SHIPMENT_BATCH_INSERT_COLUMNS,
  SHIPMENT_BATCH_CONFLICT_COLUMNS,
  SHIPMENT_BATCH_UPDATE_STRATEGIES,
} = require('./queries/shipment-batch-queries');

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

/**
 * Bulk inserts or updates shipment batch records.
 *
 * On conflict matching fulfillment_id + batch_id:
 *  - quantity_shipped is incremented
 *  - notes are merged
 *  - created_at is refreshed
 *
 * @param {Array<Object>}              shipmentBatches - Validated shipment batch objects.
 * @param {PoolClient}    client          - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Inserted or updated shipment batch records.
 * @throws  {AppError}               Normalized database error if the insert fails.
 */
const insertShipmentBatchesBulk = async (shipmentBatches, client) => {
  if (!Array.isArray(shipmentBatches) || shipmentBatches.length === 0) return [];
  
  const context = 'shipment-batch-repository/insertShipmentBatchesBulk';
  
  const rows = shipmentBatches.map((b) => [
    b.shipment_id,
    b.fulfillment_id,
    b.batch_id,
    b.quantity_shipped,
    b.notes      ?? null,
    b.created_by ?? null,
  ]);
  
  validateBulkInsertRows(rows, SHIPMENT_BATCH_INSERT_COLUMNS.length);
  
  try {
    return await bulkInsert(
      'shipment_batches',
      SHIPMENT_BATCH_INSERT_COLUMNS,
      rows,
      SHIPMENT_BATCH_CONFLICT_COLUMNS,
      SHIPMENT_BATCH_UPDATE_STRATEGIES,
      client,
      { context },
      'id'
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert shipment batches.',
      meta:    { shipmentBatchCount: shipmentBatches.length },
      logFn:   (err) => logBulkInsertError(
        err,
        'shipment_batches',
        rows,
        rows.length,
        { context, conflictColumns: SHIPMENT_BATCH_CONFLICT_COLUMNS }
      ),
    });
  }
};

module.exports = {
  insertShipmentBatchesBulk,
};

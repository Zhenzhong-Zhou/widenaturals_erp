/**
 * @file shipment-batch-queries.js
 * @description SQL column configuration for shipment-batch-repository.js.
 *
 * Exports:
 *  - SHIPMENT_BATCH_INSERT_COLUMNS    — ordered column list for bulk insert
 *  - SHIPMENT_BATCH_CONFLICT_COLUMNS  — upsert conflict target columns
 *  - SHIPMENT_BATCH_UPDATE_STRATEGIES — conflict update strategies
 */

'use strict';

// Order must match the values array in insertShipmentBatchesBulk row map.
const SHIPMENT_BATCH_INSERT_COLUMNS = [
  'shipment_id',
  'fulfillment_id',
  'batch_id',
  'quantity_shipped',
  'notes',
  'created_by',
];

// Conflict target: a shipment batch is considered duplicate when both match.
const SHIPMENT_BATCH_CONFLICT_COLUMNS = ['fulfillment_id', 'batch_id'];

const SHIPMENT_BATCH_UPDATE_STRATEGIES = {
  quantity_shipped: 'add', // accumulate shipped quantity on re-insert
  notes: 'merge_text', // concatenate notes rather than overwrite
  created_at: 'overwrite', // refresh timestamp if re-inserted
};

module.exports = {
  SHIPMENT_BATCH_INSERT_COLUMNS,
  SHIPMENT_BATCH_CONFLICT_COLUMNS,
  SHIPMENT_BATCH_UPDATE_STRATEGIES,
};

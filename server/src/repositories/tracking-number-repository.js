/**
 * Repository for the `tracking_numbers` domain.
 *
 * Persistence operations against `tracking_numbers`:
 * - Bulk duplicate pre-flight by (carrier, tracking_number) pairs.
 * - Bulk insert via the shared `bulkInsert` utility, with conflict target
 *   on (carrier, tracking_number) and ON CONFLICT DO NOTHING semantics.
 *
 * Conventions:
 * - SQL lives in ./queries/tracking-number-queries — no inline SQL.
 * - DB errors route through `handleDbError`; AppErrors pass through unchanged.
 * - Every function accepts an optional pg client so callers can enlist the
 *   operation in an existing transaction.
 */

const { query } = require('../database/db');
const { validateBulkInsertRows } = require('../utils/validation/bulk-insert-row-validator');
const {
  TRACKING_NUMBER_INSERT_COLUMNS,
  TRACKING_NUMBER_CONFLICT_COLUMNS,
  CHECK_TRACKING_NUMBERS_EXIST_BULK,
} = require('./queries/tracking-number-queries');
const { bulkInsert } = require('../utils/db/write-utils');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError, logBulkInsertError } = require('../utils/db-logger');
const AppError = require('../utils/AppError');

const CONTEXT = 'tracking-number-repository';

/**
 * Returns rows whose (carrier, tracking_number) pair already exists.
 * Service uses this to raise a precise 409 before the unique constraint fires.
 *
 * Inputs must be parallel arrays — carriers[i] is paired with trackingNumbers[i].
 *
 * @param {string[]} carriers
 * @param {string[]} trackingNumbers
 * @param {object} [client] - Optional pg client for transactional reads.
 * @returns {Promise<TrackingNumberDuplicateRow[]>}
 */
const findExistingTrackingByCarrierPairs = async (
  carriers,
  trackingNumbers,
  client
) => {
  const context = `${CONTEXT}/findExistingTrackingByCarrierPairs`;
  
  if (!carriers?.length || !trackingNumbers?.length) return [];
  
  try {
    const { rows } = await query(
      CHECK_TRACKING_NUMBERS_EXIST_BULK,
      [carriers, trackingNumbers],
      client
    );
    return rows;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw handleDbError(error, { context, logFn: logDbQueryError });
  }
};

/**
 * Bulk-inserts tracking number rows. Hot path for outbound shipment creation.
 *
 * Row tuple order MUST match TRACKING_NUMBER_INSERT_COLUMNS exactly — change one,
 * change both. `updated_at` / `updated_by` are null at insert; the update
 * trigger populates them on first modification.
 *
 * Conflict on (carrier, tracking_number) is DO NOTHING — callers are expected
 * to pre-flight duplicates via findExistingTrackingByCarrierPairs and raise
 * a 409 before this is reached.
 *
 * @param {TrackingNumberInsertRow[]} trackingRecords
 * @param {PoolClient} [client]
 * @param {object} [meta] - Forwarded into bulkInsert logging meta.
 * @returns {Promise<TrackingNumberRow[]>}
 */
const insertTrackingNumbersBulk = async (
  trackingRecords,
  client,
  meta = {}
) => {
  if (!Array.isArray(trackingRecords) || trackingRecords.length === 0)
    return [];
  
  const context = `${CONTEXT}/insertTrackingNumbersBulk`;
  
  // Tuple order must mirror TRACKING_NUMBER_INSERT_COLUMNS one-to-one.
  const rows = trackingRecords.map((record) => [
    record.outbound_shipment_id,
    record.tracking_number ?? null,
    record.carrier,
    record.service_name ?? null,
    record.bol_number ?? null,
    record.freight_type ?? null,
    record.custom_notes ?? null,
    record.shipped_date ?? null,
    record.created_by ?? null,
    null, // updated_at — trigger fills on first update
    null, // updated_by — populated on first update
  ]);
  
  validateBulkInsertRows(rows, TRACKING_NUMBER_INSERT_COLUMNS.length);
  
  try {
    return await bulkInsert(
      'tracking_numbers',
      TRACKING_NUMBER_INSERT_COLUMNS,
      rows,
      TRACKING_NUMBER_CONFLICT_COLUMNS,
      {}, // empty update set = ON CONFLICT DO NOTHING
      client,
      { meta: { context, ...meta } },
      '*'
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw handleDbError(error, {
      context,
      message: 'Failed to insert tracking number records.',
      meta: { recordCount: trackingRecords.length },
      logFn: (err) =>
        logBulkInsertError(err, 'tracking_numbers', rows, rows.length, {
          context,
          conflictColumns: TRACKING_NUMBER_CONFLICT_COLUMNS,
        }),
    });
  }
};

module.exports = {
  findExistingTrackingByCarrierPairs,
  insertTrackingNumbersBulk,
};

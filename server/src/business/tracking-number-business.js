/**
 * Business-layer guards and validators for the `tracking_numbers` domain.
 *
 * Responsibility split:
 * - Joi schemas (route layer) cover shape, type, and format.
 * - This file enforces cross-field and cross-record business rules that Joi
 *   can't express cleanly: status gating, delivery-method compatibility,
 *   freight-type/BOL coupling, in-payload duplicate detection, and a final
 *   DB-backed (carrier, tracking_number) uniqueness check.
 *
 * Expected service-layer call order:
 *   1. assertShipmentStatusAllowsTracking
 *   2. assertDeliveryMethodAllowsTracking
 *   3. validateTrackingRecords                 (in-payload duplicates + sanity)
 *   4. assertNoDuplicateTrackingNumbers        (DB-backed; runs last)
 *
 * All guards throw AppError — no try/catch needed at call sites.
 */

const AppError = require('../utils/AppError');
const {
  findExistingTrackingByCarrierPairs,
} = require('../repositories/tracking-number-repository');

// Statuses that allow tracking numbers to be attached.
// Keep in sync with the `shipment_status` table codes.
const TRACKING_ATTACHABLE_STATUSES = new Set([
  'SHIPMENT_READY',
  'SHIPMENT_IN_TRANSIT',
  // SHIPMENT_COMPLETED / SHIPMENT_DELIVERED intentionally excluded —
  // late corrections should go through a dedicated edit path, not creation.
]);

// Allowed freight types. Must match TrackingNumberInputRecord.freightType
// in tracking-number-types.js and the Joi enum on the route.
const FREIGHT_TYPES = new Set(['PARCEL', 'LTL', 'FTL', 'AIR', 'OCEAN']);

// Freight types where a BOL number is a hard business requirement.
const FREIGHT_TYPES_REQUIRING_BOL = new Set(['LTL', 'FTL']);

/**
 * Throws if the shipment's current status doesn't permit tracking-number attachment.
 * @param {string} statusCode
 */
const assertShipmentStatusAllowsTracking = (statusCode) => {
  if (!TRACKING_ATTACHABLE_STATUSES.has(statusCode)) {
    throw AppError.businessError(
      `Cannot attach tracking numbers to a shipment in status '${statusCode}'. ` +
      `Allowed statuses: ${[...TRACKING_ATTACHABLE_STATUSES].join(', ')}.`
    );
  }
};

/**
 * Throws if the resolved delivery method is incompatible with tracking,
 * or if it requires a tracking number on every record and any are missing.
 *
 * @param {DeliveryMethodAttachContext} deliveryMethod
 * @param {TrackingNumberInputRecord[]} records
 */
const assertDeliveryMethodAllowsTracking = (deliveryMethod, records) => {
  if (deliveryMethod.isPickupLocation) {
    throw AppError.businessError(
      `Delivery method '${deliveryMethod.methodName}' is a pickup location and ` +
      `does not support tracking numbers.`
    );
  }
  
  if (!deliveryMethod.requiresTrackingNumber) return;
  
  const missingIndices = records.reduce((acc, r, i) => {
    if (!r.trackingNumber?.trim()) acc.push(i);
    return acc;
  }, []);
  
  if (missingIndices.length > 0) {
    throw AppError.validationError(
      `Delivery method '${deliveryMethod.methodName}' requires a tracking number ` +
      `for every record. Missing at indices: ${missingIndices.join(', ')} ` +
      `(${missingIndices.length} of ${records.length} records).`
    );
  }
};

/**
 * Validates cross-field business rules and in-payload duplicates.
 * Joi handles shape/format; this catches the rest.
 *
 * @param {TrackingNumberInputRecord[]} records
 */
const validateTrackingRecords = (records) => {
  if (!Array.isArray(records) || records.length === 0) {
    throw AppError.validationError('At least one tracking record is required.');
  }
  
  // Tracks (carrier, tracking_number) pairs already seen in this payload.
  // Null tracking is allowed to repeat (it represents "carrier known, number TBD").
  const seenPairs = new Set();
  
  records.forEach((record, idx) => {
    if (record.freightType && !FREIGHT_TYPES.has(record.freightType)) {
      throw AppError.validationError(
        `Record at index ${idx} has invalid freight_type '${record.freightType}'. ` +
        `Allowed: ${[...FREIGHT_TYPES].join(', ')}.`
      );
    }
    
    // LTL/FTL freight requires a BOL — soft business rule, not a DB constraint.
    if (
      FREIGHT_TYPES_REQUIRING_BOL.has(record.freightType) &&
      !record.bolNumber
    ) {
      throw AppError.validationError(
        `Record at index ${idx} (${record.freightType}) requires a BOL number.`
      );
    }
    
    if (!record.trackingNumber) return;
    
    const key = `${record.carrier}::${record.trackingNumber}`;
    if (seenPairs.has(key)) {
      throw AppError.validationError(
        `Duplicate (carrier, tracking_number) within payload at index ${idx}: ${key}.`
      );
    }
    seenPairs.add(key);
  });
};

/**
 * DB-backed uniqueness check. Pre-flights the (carrier, tracking_number)
 * unique constraint so callers can surface a precise 409 with conflict meta
 * instead of a generic constraint-violation error.
 *
 * Must run AFTER validateTrackingRecords so in-payload duplicates are
 * eliminated before hitting the database.
 *
 * @param {TrackingNumberInputRecord[]} records
 * @param {object} [client] - Optional pg client for transactional reads.
 */
const assertNoDuplicateTrackingNumbers = async (records, client) => {
  // NULL tracking_number rows can't violate the unique constraint
  // (Postgres NULL-distinct semantics), so skip them entirely.
  const checkable = records.filter((r) => r.trackingNumber);
  if (checkable.length === 0) return;
  
  const carriers = checkable.map((r) => r.carrier);
  const trackingNumbers = checkable.map((r) => r.trackingNumber);
  
  const existing = await findExistingTrackingByCarrierPairs(
    carriers,
    trackingNumbers,
    client
  );
  
  if (existing.length === 0) return;
  
  throw AppError.conflictError(
    `${existing.length} tracking number(s) already exist for the given carrier(s).`,
    {
      meta: {
        conflicts: existing.map((r) => ({
          id: r.id,
          carrier: r.carrier,
          trackingNumber: r.tracking_number,
          existingShipmentId: r.outbound_shipment_id,
        })),
      },
    }
  );
};

/**
 * Normalizes a raw tracking-number input: strips whitespace and dots,
 * upper-cases the result. Returns null for null/empty input.
 *
 * @param {string|null|undefined} raw
 * @returns {string|null}
 */
const normalizeTrackingNumber = (raw) => {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[\s.]/g, '').toUpperCase();
  return cleaned || null;
};

/**
 * Maps a tracking-number input record into a tracking_numbers insert row.
 *
 * @param {TrackingNumberInputRecord} record
 * @param {Object} context
 * @param {string} context.outboundShipmentId
 * @param {string} context.userId
 * @returns {Object}
 */
const buildTrackingNumberInsertRow = (
  record,
  { outboundShipmentId, userId }
) => ({
  outbound_shipment_id: outboundShipmentId,
  tracking_number: normalizeTrackingNumber(record.trackingNumber),
  carrier: record.carrier,
  service_name: record.serviceName ?? null,
  bol_number: record.bolNumber ?? null,
  freight_type: record.freightType ?? null,
  custom_notes: record.customNotes ?? null,
  shipped_date: record.shippedDate ?? null,
  created_by: userId,
});

module.exports = {
  TRACKING_ATTACHABLE_STATUSES,
  FREIGHT_TYPES,
  FREIGHT_TYPES_REQUIRING_BOL,
  assertShipmentStatusAllowsTracking,
  assertDeliveryMethodAllowsTracking,
  validateTrackingRecords,
  assertNoDuplicateTrackingNumbers,
  normalizeTrackingNumber,
  buildTrackingNumberInsertRow,
};

/**
 * Business-layer guards, validators, and composite helpers for the
 * `tracking_numbers` domain.
 *
 * Responsibility split:
 * - Joi schemas (route layer) cover shape, type, and format.
 * - This file enforces cross-field and cross-record business rules that Joi
 *   can't express cleanly: status gating, delivery-method compatibility,
 *   freight-type/BOL coupling, in-payload duplicate detection, and a final
 *   DB-backed (carrier, tracking_number) uniqueness check.
 *
 * Two layers live here:
 *
 * 1. Atomic guards — each throws AppError on violation; no try/catch needed
 *    at call sites. The composition order when callers invoke them manually:
 *      a. assertShipmentStatusAllowsTracking
 *      b. assertDeliveryMethodAllowsTracking   (lookup row, not a code)
 *      c. validateTrackingRecords           (in-payload duplicates + sanity)
 *      d. assertNoDuplicateTrackingNumbers  (DB-backed; runs last)
 *
 * 2. `attachTrackingNumbersToShipment` — composite helper used by both the
 *    standalone `createTrackingNumbersService` and the inline tracking attach
 *    in `completeOutboundFulfillmentService`. Runs (a)–(d) end-to-end and
 *    performs the bulk insert with conflict reconciliation. Warehouse-scope
 *    checks live with the caller (they need the shipment record); everything
 *    else is encapsulated.
 */

const AppError = require('../utils/AppError');
const {
  findExistingTrackingByCarrierPairs, insertTrackingNumbersBulk,
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
  // Pickup CAN'T have tracking — only throws if someone tried to attach any
  if (deliveryMethod.isPickupLocation && records.length > 0) {
    throw AppError.businessError(
      `Delivery method '${deliveryMethod.methodName}' is a pickup location and ` +
      `does not support tracking numbers.`
    );
  }
  
  // Carrier requires tracking — only throws if required but none provided
  if (deliveryMethod.requiresTrackingNumber && records.length === 0) {
    throw AppError.businessError(
      `Delivery method '${deliveryMethod.methodName}' requires at least one ` +
      `tracking number.`
    );
  }
  
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

/**
 * Attaches tracking numbers to an outbound shipment.
 *
 * Runs the cross-field and DB-backed validations (delivery method
 * compatibility, in-payload duplicates, then the DB-backed
 * `(carrier, tracking_number)` uniqueness pre-flight), then bulk-inserts the
 * rows and reconciles the returned count against expected. A short insert
 * count surfaces a 409 — this happens when a concurrent insert lands between
 * the pre-flight and the `ON CONFLICT DO NOTHING` bulk insert.
 *
 * No-op (returns `[]`) when `records` is empty — supports both the standalone
 * `createTrackingNumbersService` and the inline attach inside
 * `completeOutboundFulfillmentService` where trackings are optional.
 *
 * Status gating and warehouse-scope checks are NOT enforced here. Callers
 * must run `assertShipmentStatusAllowsTracking` and the warehouse-scope
 * helpers before invoking.
 *
 * @param {string} outboundShipmentId - UUID of the parent outbound shipment.
 * @param {string} statusCode - Current shipment status code; gates whether tracking attach is allowed.
 * @param {DeliveryMethodAttachContext} deliveryMethod - Delivery method record from the shipment (lookup row, not a code).
 * @param {TrackingNumberInputRecord[]} records - Validated tracking payload from the request.
 * @param {string} userId - UUID of the actor; written to created_by / updated_by.
 * @param {object} client - Transaction-bound client; this helper does not open its own.
 * @returns {Promise<TrackingNumberRow[]>} Inserted rows in DB column order (raw, untransformed).
 */
const attachTrackingNumbersToShipment = async (
  {
    outboundShipmentId,
    statusCode,
    deliveryMethod,
    records,
    userId
  },
  client
) => {
  if (!records?.length) return [];
  
  assertShipmentStatusAllowsTracking(statusCode);
  assertDeliveryMethodAllowsTracking(deliveryMethod, records);
  validateTrackingRecords(records);
  await assertNoDuplicateTrackingNumbers(records, client);
  
  const rows = records.map((record) =>
    buildTrackingNumberInsertRow(record, { outboundShipmentId, userId })
  );
  
  const inserted = await insertTrackingNumbersBulk(rows, client);
  
  if (inserted.length < rows.length) {
    throw AppError.conflictError(
      'Tracking number conflict detected during insert. Please retry.',
      { meta: { expected: rows.length, inserted: inserted.length } }
    );
  }
  
  return inserted;
};

module.exports = {
  attachTrackingNumbersToShipment,
};

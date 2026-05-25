/**
 * Joi schemas for the `tracking_numbers` domain.
 *
 * Responsibilities:
 * - Shape + format validation of inbound request payloads.
 * - Hard caps (array size, string length) to prevent abuse.
 *
 * Deferred to the business layer (tracking-number-business.js):
 * - LTL/FTL → BOL number requirement.
 * - In-payload (carrier, tracking_number) duplicates.
 * - DB-backed global uniqueness on (carrier, tracking_number).
 * - Shipment status / delivery method gating.
 *
 * Enum values for `freightType` mirror the DB CHECK constraint
 * `check_freight_type` — keep these three in sync (DB / Joi / business).
 */

const Joi = require('joi');
const {
  validateOptionalString,
  validateString,
} = require('./general-validators');

// Allowed freight types. Source of truth is the DB CHECK constraint —
// any change here must land alongside a migration update.
const FREIGHT_TYPES = ['PARCEL', 'LTL', 'FTL', 'AIR', 'OCEAN', 'COURIER'];

const trackingNumberRecordSchema = Joi.object({
  carrier: validateString('Carrier', 3, 100),
  
  trackingNumber: Joi.string()
    .max(40)
    .custom((value, helpers) => {
      // Validate the shape the normalizer WILL produce; do not mutate.
      const canonical = value.replace(/[\s.]/g, '');
      if (!/^[A-Z0-9-]{8,30}$/i.test(canonical)) {
        return helpers.error('string.pattern.base');
      }
      return value;
    })
    .optional()
    .messages({
      'string.pattern.base':
        'Tracking number must be 8-30 alphanumeric characters (spaces and dots are stripped).',
    }),
  
  serviceName: validateOptionalString('Service Name', 100),
  bolNumber: validateOptionalString('BOL Number', 100),
  
  freightType: Joi.string()
    .valid(...FREIGHT_TYPES)
    .optional()
    .messages({
      'any.only': `Freight type must be one of: ${FREIGHT_TYPES.join(', ')}.`,
    }),
  
  customNotes: validateOptionalString('Custom Notes', 1000),
  shippedDate: Joi.date().iso().optional(),
});

const attachTrackingNumbersBodySchema = Joi.object({
  records: Joi.array()
    .items(trackingNumberRecordSchema)
    .min(1)
    // Hard cap to prevent abuse / oversized transactions.
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one tracking record is required.',
      'array.max': 'Cannot attach more than 50 tracking records at once.',
    }),
});

module.exports = {
  trackingNumberRecordSchema,
  attachTrackingNumbersBodySchema,
};

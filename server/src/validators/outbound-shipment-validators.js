const Joi = require('joi');
const { validateUUID } = require('./general-validators');

/**
 * Joi schema for validating the `shipmentId` route parameter.
 *
 * Fields:
 * - `shipmentId` (UUID)
 *    - Required
 *    - Must be a valid UUID (typically version 4)
 *
 * Common usage:
 * - Route validation for endpoints like:
 *     GET /api/v1/outbound-shipments/:shipmentId/details
 *     PATCH /api/v1/outbound-shipments/:shipmentId/status
 */
const shipmentIdParamSchema = Joi.object({
  shipmentId: validateUUID('Shipment ID'),
});

module.exports = {
  shipmentIdParamSchema
};

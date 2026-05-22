/**
 * Controllers for the `tracking_numbers` domain.
 *
 * Thin pass-through layer: extract from req, call the service, shape the
 * envelope, set the status code. No business logic, no logging, no JSDoc
 * on individual controller functions (per house convention).
 */

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const { createTrackingNumbersService } = require('../services/tracking-number-service');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/tracking-numbers/shipments/:shipmentId/attach
// ─────────────────────────────────────────────────────────────────────────────

const attachTrackingNumbersController = wrapAsyncHandler(async (req, res) => {
  const { shipmentId } = req.params;
  const { records } = req.body;
  const user = req.auth.user;
  
  const result = await createTrackingNumbersService({
    outboundShipmentId: shipmentId,
    records,
    user,
  });
  
  res.status(201).json({
    success: true,
    message: `Attached ${result.count} tracking number(s) to shipment ${shipmentId}.`,
    data: result,
    traceId: req.traceId,
  });
});

module.exports = {
  attachTrackingNumbersController,
};

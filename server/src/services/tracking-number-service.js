/**
 * Service layer for the `tracking_numbers` domain.
 *
 * Orchestrates the "attach tracking numbers to a shipment" flow inside a
 * single transaction:
 *   1. Load the shipment (with delivery method + status) — 404 if missing.
 *   2. Enforce warehouse scope from the shipment's warehouse, not user input.
 *   3. Gate on shipment status (must allow tracking attachment).
 *   4. Delegate the attach to the business layer, which owns the
 *      delivery-method gate, record validation, duplicate pre-flight,
 *      bulk insert, and insert-count reconciliation.
 *   5. Return a lean { count, ids } — frontend refreshes via the list endpoint.
 *
 * Conventions:
 * - All work happens inside withTransaction so the dup check + insert are atomic.
 * - AppErrors pass through unchanged; non-AppErrors become serviceError.
 * - No logging here — the global error handler owns that.
 */

const AppError = require('../utils/AppError');
const { withTransaction } = require('../database/db');
const {
  assertWarehouseAccess,
  enforceWarehouseScope,
} = require('../business/warehouse-inventory-business');
const {
  getOutboundShipmentForTrackingAttach,
} = require('../repositories/outbound-shipment-repository');
const { attachTrackingNumbersToShipment } = require('../business/tracking-number-business');
const {
  transformOutboundShipmentForTrackingAttachRow,
  transformCreateTrackingNumbersResult,
} = require('../transformers/outbound-fulfillment-transformer');

const CONTEXT = 'tracking-number-service';

/**
 * Inserts one or more tracking numbers for an outbound shipment.
 *
 * @param {Object} params
 * @param {string} params.outboundShipmentId
 * @param {TrackingNumberInputRecord[]} params.records
 * @param {Object} params.user                  - Authenticated user (req.auth.user).
 * @returns {Promise<CreateTrackingNumbersResult>}
 */
const createTrackingNumbersService = async ({
                                              outboundShipmentId,
                                              records,
                                              user,
                                            }) => {
  const context = `${CONTEXT}/createTrackingNumbersService`;
  
  try {
    return await withTransaction(async (client) => {
      // 1. Load shipment + delivery method + status in a single query.
      const rawShipment = await getOutboundShipmentForTrackingAttach(
        outboundShipmentId,
        client
      );
      
      if (!rawShipment) {
        throw AppError.notFoundError(
          `Outbound shipment ${outboundShipmentId} not found.`
        );
      }
      
      const shipment = transformOutboundShipmentForTrackingAttachRow(rawShipment);
      
      // 2. Warehouse scope is derived from the shipment, never trusted from input.
      const { assignedWarehouseIds, canViewAll } =
        await assertWarehouseAccess(user);
      if (!canViewAll) {
        enforceWarehouseScope(assignedWarehouseIds, shipment.warehouseId);
      }
      
      // 3. Delegate the attach — business layer owns delivery-method gate,
      //    record validation, duplicate pre-flight, insert, and reconcile.
      const insertedTrackings = await attachTrackingNumbersToShipment(
        {
          outboundShipmentId,
          statusCode: shipment.statusCode,
          deliveryMethod: shipment.deliveryMethod,
          records,
          userId: user.id,
        },
        client
      );
      
      // 4. Lean response — frontend refreshes via the list endpoint.
      return transformCreateTrackingNumbersResult(insertedTrackings);
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError(
      'Unable to attach tracking numbers at this time.',
      {
        context,
        meta: { error: error.message },
      }
    );
  }
};

module.exports = {
  createTrackingNumbersService,
};

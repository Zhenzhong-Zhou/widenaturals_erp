/**
 * @file bom-item-controller.js
 * @module controllers/bom-item-controller
 *
 * @description
 * Controllers for the BOM Item resource.
 *
 * Routes:
 *   GET /api/v1/boms/:bomId/material-supply  → getBomMaterialSupplyDetailsController
 *
 * All handlers are wrapped with `wrapAsyncHandler` — errors propagate
 * automatically to the global error handler without try/catch boilerplate.
 *
 * Logging:
 *   Transport-level logs (statusCode, durationMs, userId, traceId) are emitted
 *   automatically by the global request-logger middleware via res.on('finish').
 *   No controller-level logging needed.
 *
 * Not-found handling:
 *   The service layer throws AppError.notFound() when no records are found.
 *   Controllers never check result length or manually return 404.
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  fetchBomMaterialSupplyDetailsService,
} = require('../services/bom-item-service');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/boms/:bomId/material-supply
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves material supply details for a specific BOM.
 *
 * Not-found case is handled by the service layer via AppError.notFound().
 * Requires: auth middleware, VIEW_BOMS permission.
 */
const getBomMaterialSupplyDetailsController = wrapAsyncHandler(async (req, res) => {
  const { bomId } = req.params;
  
  const result = await fetchBomMaterialSupplyDetailsService(bomId);
  
  res.status(200).json({
    success: true,
    message: 'BOM material supply details retrieved successfully.',
    data: {
      summary: result.summary || null,
      details: result,
    },
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getBomMaterialSupplyDetailsController,
};

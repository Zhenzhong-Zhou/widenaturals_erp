const wrapAsync = require('../utils/wrap-async');
const { logInfo } = require('../utils/logger-helper');
const {
  fetchBomMaterialSupplyDetailsService,
} = require('../services/bom-item-service');

/**
 * @async
 * @function
 * @description
 * Controller: Fetch detailed BOM material supply data (including packaging materials, suppliers, and batches)
 * for a given BOM ID.
 *
 * Responsibilities:
 *  - Validate BOM ID parameter
 *  - Call `fetchBomMaterialSupplyDetailsService`
 *  - Return structured data + cost summary in JSON
 *  - Handle and log any service-level exceptions
 *
 * @route GET /api/boms/:bomId/material-supply
 * @param {import('express').Request} req Express request object
 * @param {import('express').Response} res Express response object
 * @param {import('express').NextFunction} next Express next middleware function
 *
 * @example
 * // Example request:
 * GET /api/boms/fefec9a0-0165-4246-acd3-9af4f8781475/material-supply
 *
 * // Example response:
 * {
 *   "success": true,
 *   "message": "BOM Material Supply Details fetched successfully.",
 *   "data": {
 *     "summary": {
 *       "totalEstimatedCost": 1234.56,
 *       "totalActualCost": 1289.43,
 *       "variance": 54.87,
 *       "variancePercentage": 4.44,
 *       "baseCurrency": "CAD"
 *     },
 *     "details": [ ...nested BOM items... ]
 *   }
 * }
 */
const getBomMaterialSupplyDetailsController = wrapAsync(async (req, res) => {
  const { bomId } = req.params;

  logInfo('Fetching BOM Material Supply Details', req, {
    context: 'bom-item-controller/getBomMaterialSupplyDetailsController',
    bomId,
  });

  // --- Call Service ---
  const result = await fetchBomMaterialSupplyDetailsService(bomId);

  if (!result || result.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No BOM material supply details found for the specified BOM ID.',
      data: null,
    });
  }

  // --- Build structured response ---
  res.status(200).json({
    success: true,
    message: 'BOM Material Supply Details fetched successfully.',
    data: {
      summary: result.summary || null,
      details: result,
    },
  });
});

module.exports = {
  getBomMaterialSupplyDetailsController,
};

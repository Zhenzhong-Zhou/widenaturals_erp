const { fetchWarehouseLotAdjustmentTypes } = require('../services/lot-adjustment-type-service');
const { logError } = require('../utils/logger-helper');
const wrapAsync = require('../utils/wrap-async');

/**
 * Controller to fetch warehouse lot adjustment types.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param next
 */
const getWarehouseLotAdjustmentTypesController = wrapAsync(async (req, res, next) => {
  try {
    const adjustmentTypes = await fetchWarehouseLotAdjustmentTypes();
    res.status(200).json(adjustmentTypes);
  } catch (error) {
    logError('Error in getWarehouseLotAdjustmentTypesController:', error);
    next(error);
  }
});

module.exports = {
  getWarehouseLotAdjustmentTypesController,
};

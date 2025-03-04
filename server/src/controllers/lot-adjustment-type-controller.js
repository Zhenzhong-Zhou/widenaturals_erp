const {
  fetchWarehouseLotAdjustmentTypesForDropDown,
} = require('../services/lot-adjustment-type-service');
const { logError } = require('../utils/logger-helper');
const wrapAsync = require('../utils/wrap-async');

/**
 * Controller to fetch warehouse lot adjustment types for dropdown.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next function.
 */
const getWarehouseLotAdjustmentTypesForDropdownController = wrapAsync(
  async (req, res, next) => {
    try {
      const adjustmentTypes = await fetchWarehouseLotAdjustmentTypesForDropDown();
      res.status(200).json(adjustmentTypes);
    } catch (error) {
      logError('Error fetching in getWarehouseLotAdjustmentTypesController:', error);
      next(error);
    }
  }
);

module.exports = {
  getWarehouseLotAdjustmentTypesForDropdownController,
};

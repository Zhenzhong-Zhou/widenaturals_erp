const { fetchAllOrderTypes } = require('../services/order-type-service');
const { logError } = require('../utils/logger-helper');
const wrapAsync = require('../utils/wrap-async');

/**
 * Controller to fetch all order types
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const fetchOrderTypesController = wrapAsync(async (req, res, next) => {
  try {
    const { message, data } = await fetchAllOrderTypes();
    
    return res.status(200).json({
      success: true,
      message,
      data,
    });
  } catch (error) {
    logError('Error in fetchOrderTypesController:', error);
    next(error); // Pass error to global error handler
  }
});

module.exports = {
  fetchOrderTypesController,
};
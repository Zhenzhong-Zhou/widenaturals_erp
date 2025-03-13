const {
  fetchAllOrderTypes,
  fetchOrderTypesForDropdown,
} = require('../services/order-type-service');
const { logError } = require('../utils/logger-helper');
const wrapAsync = require('../utils/wrap-async');

/**
 * Controller to fetch all order types
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const getOrderTypesController = wrapAsync(async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'ASC',
    } = req.query;

    // Convert query params to numbers where needed
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const { message, data, pagination } = await fetchAllOrderTypes(
      pageNumber,
      limitNumber,
      sortBy,
      sortOrder
    );

    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    });
  } catch (error) {
    logError('Error in fetchOrderTypesController:', error);
    next(error); // Pass error to global error handler
  }
});

const getOrderTypesDropdownController = wrapAsync(async (req, res, next) => {
  try {
    const { data } = await fetchOrderTypesForDropdown();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = {
  getOrderTypesController,
  getOrderTypesDropdownController,
};

const {
  fetchAllPriceTypes,
  fetchPricingTypeDetailsByPricingTypeId,
  fetchAvailablePricingTypesForDropdown,
} = require('../services/price-type-service');
const { logInfo, logError } = require('../utils/logger-helper');
const wrapAsync = require('../utils/wrap-async');
const AppError = require('../utils/AppError');

/**
 * Controller: Handles GET request to fetch paginated pricing types with optional filters.
 *
 * @route GET /api/v1/pricing-types
 * @access Protected
 *
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=10] - Page size
 * @query {string} [name] - Optional name/code search keyword
 * @query {string} [startDate] - Optional start date for status_date filter
 * @query {string} [endDate] - Optional end date for status_date filter
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getAllPriceTypesController = wrapAsync(async (req, res, next) => {
  const { page = 1, limit = 10, name, startDate, endDate } = req.query;
  const user = req.user;
  
  logInfo('Request received for fetching pricing types', req, {
    context: 'pricing-type-controller',
    page,
    limit,
    userId: user?.id,
  });
  
  const { data, pagination } = await fetchAllPriceTypes({
    page: Number(page),
    limit: Number(limit),
    name,
    startDate,
    endDate,
    user,
  });
  
  // Call the service layer to fetch price types
  res.status(200).json({
    success: true,
    message: 'Pricing types fetched successfully.',
    data,
    pagination,
  });
});

/**
 * Controller to fetch pricing type details.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param next
 */
const getPricingTypeDetailsByIdController = wrapAsync(
  async (req, res, next) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
      logInfo('Handling request to fetch pricing type details');
      const pricingDetails = await fetchPricingTypeDetailsByPricingTypeId(
        id,
        page,
        limit
      );
      res.status(200).json({
        success: true,
        data: pricingDetails,
      });
    } catch (error) {
      logError('Error in getPricingTypeDetails controller', error);

      next(error);
    }
  }
);

/**
 * Controller to handle fetching pricing types for dropdowns based on product ID.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 */
const getPricingTypesForDropdownController = wrapAsync(
  async (req, res, next) => {
    try {
      const { productId } = req.query; // Extract productId from query parameters
      const pricingTypes =
        await fetchAvailablePricingTypesForDropdown(productId); // Pass productId to the service
      res.status(200).json(pricingTypes);
    } catch (error) {
      next(error); // Passes the error to global error handling middleware
    }
  }
);

module.exports = {
  getAllPriceTypesController,
  getPricingTypeDetailsByIdController,
  getPricingTypesForDropdownController,
};

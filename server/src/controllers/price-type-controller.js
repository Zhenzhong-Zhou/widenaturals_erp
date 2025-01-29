const { fetchAllPriceTypes, fetchPricingTypeDetailsByPricingTypeId } = require('../services/price-type-service');
const { logInfo, logError } = require('../utils/logger-helper');
const wrapAsync = require('../utils/wrap-async');

/**
 * Controller to handle fetching all price types.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getPriceTypesController = wrapAsync(async (req, res, next) => {
  try {
    // Extract query parameters for pagination and filtering
    const { page = 1, limit = 10, name, status } = req.query;
    
    logInfo('Handling request to fetch price types', { page, limit, name, status });
    
    // Call the service layer to fetch price types
    const result = await fetchAllPriceTypes({ page: +page, limit: +limit, name, status });
    
    // Send successful response
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    // Log and send error response
    logError('Error in getAllPriceTypes controller', {
      message: error.message,
      stack: error.stack,
    });
    
    next(error);
  }
});

/**
 * Controller to fetch pricing type details.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param next
 */
const getPricingTypeDetailsByIdController = wrapAsync(async (req, res, next) => {
  const { id, page = 1, limit = 10 } = req.params;
  
  try {
    logInfo('Handling request to fetch pricing type details');
    const pricingDetails = await fetchPricingTypeDetailsByPricingTypeId(id, page, limit);
    res.status(200).json({
      success: true,
      data: pricingDetails,
    });
  } catch (error) {
    logError('Error in getPricingTypeDetails controller', error);
    
    next(error);
  }
});

module.exports = {
  getPriceTypesController,
  getPricingTypeDetailsByIdController,
};

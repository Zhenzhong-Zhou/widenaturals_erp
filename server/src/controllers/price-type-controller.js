const { fetchAllPriceTypes } = require('../services/price-type-service');
const { logInfo, logError } = require('../utils/logger-helper');

/**
 * Controller to handle fetching all price types.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getPriceTypesController = async (req, res) => {
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
    
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch price types',
      ...(error.details ? { details: error.details } : {}),
    });
  }
};

module.exports = {
  getPriceTypesController,
};

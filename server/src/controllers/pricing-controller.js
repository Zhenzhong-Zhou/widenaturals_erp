const { fetchAllPricings } = require('../services/pricing-service');

/**
 * Controller to handle the fetching of paginated pricing records.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const getPricingsController = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    
    // Ensure page and limit are numbers
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    
    const pricingData = await fetchAllPricings({ page: parsedPage, limit: parsedLimit });
    
    return res.status(200).json({
      success: true,
      message: 'Pricing records fetched successfully.',
      data: pricingData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPricingsController,
}

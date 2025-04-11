const wrapAsync = require('../utils/wrap-async');
const {
  fetchAllPricings,
  fetchPricingDetailsByPricingId,
  fetchPriceByProductAndPriceType,
} = require('../services/pricing-service');

/**
 * Controller to handle the fetching of paginated pricing records.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const getPricingsController = wrapAsync(async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    // Ensure page and limit are numbers
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;

    const pricingData = await fetchAllPricings({
      page: parsedPage,
      limit: parsedLimit,
    });

    return res.status(200).json({
      success: true,
      message: 'Pricing records fetched successfully.',
      data: pricingData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * API Controller to get pricing details by ID.
 */
const getPricingDetailsController = wrapAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;

    const pricingDetails = await fetchPricingDetailsByPricingId(
      id,
      page,
      limit
    );

    return res.status(200).json({
      success: true,
      message: 'Pricing details fetched successfully',
      data: pricingDetails,
    });
  } catch (error) {
    next(error);
  }
});

const getPriceByProductAndPriceTypeController = wrapAsync(
  async (req, res, next) => {
    const { productId, priceTypeId } = req.query;

    try {
      const price = await fetchPriceByProductAndPriceType(
        productId,
        priceTypeId
      );

      res.status(200).json(price);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = {
  getPricingsController,
  getPricingDetailsController,
  getPriceByProductAndPriceTypeController,
};

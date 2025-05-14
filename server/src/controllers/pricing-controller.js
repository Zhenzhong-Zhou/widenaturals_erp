const wrapAsync = require('../utils/wrap-async');
const {
  fetchPaginatedPricingRecordsService,
  fetchPricingDetailsByPricingId,
  fetchPriceByProductAndPriceType,
} = require('../services/pricing-service');

/**
 * Controller to handle the fetching of paginated pricing records.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const getPaginatedPricingRecordsController = wrapAsync(async (req, res, next) => {
  const {
    page,
    limit,
    sortBy,
    sortOrder,
    keyword,
    brand,
    pricingType,
    countryCode,
    sizeLabel,
    validFrom,
    validTo,
  } = req.query;
  
  // Parse and normalize numeric values
  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 10;
  
  // Build filters object
  const filters = {
    ...(brand && { brand }),
    ...(pricingType && { pricingType }),
    ...(countryCode && { countryCode }),
    ...(sizeLabel && { sizeLabel }),
    ...(validFrom && { validFrom }),
    ...(validTo && { validTo }),
  };
  
  const pricingData = await fetchPaginatedPricingRecordsService({
    page: parsedPage,
    limit: parsedLimit,
    sortBy,
    sortOrder,
    filters,
    keyword,
  });
  
  return res.status(200).json({
    success: true,
    message: 'Pricing records fetched successfully.',
    ...pricingData, // includes data and pagination
  });
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
  getPricingsController: getPaginatedPricingRecordsController,
  getPricingDetailsController,
  getPriceByProductAndPriceTypeController,
};

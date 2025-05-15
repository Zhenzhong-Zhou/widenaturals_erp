const wrapAsync = require('../utils/wrap-async');
const {
  fetchPaginatedPricingRecordsService,
  fetchPricingDetailsByPricingId,
  fetchPriceByProductAndPriceType, exportPricingRecordsService,
} = require('../services/pricing-service');
const { logInfo } = require('../utils/logger-helper');
const { exportData } = require('../utils/export-utils');
const { generateTimestampedFilename } = require('../utils/name-utils');

/**
 * Controller to handle the fetching of paginated pricing records.
 *
 * @param {Request} req - Express a request object.
 * @param {Response} res - Express response object.
 */
const getPaginatedPricingRecordsController = wrapAsync(async (req, res) => {
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
 * Controller to export pricing records.
 * Accepts optional filters and export format (default: csv).
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const exportPricingRecordsController = wrapAsync(async (req, res) => {
  const { format = 'csv' } = req.query;
  const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
  
  const context = 'pricing-controller/exportPricingRecordsController';
  
  logInfo('Starting pricing export', req, {
    context,
    format,
    filters,
  });
  
  // Fetch raw export data using filters
  const exportRows = await exportPricingRecordsService(filters, format);
  
  // Export a final file using utility (handles formatting and content-type), handles an empty case inside
  const { fileBuffer, contentType, filename } = await exportData({
    data: exportRows,
    exportFormat: format,
    filename: 'pricing_export',
    title: 'Pricing Export',
  });
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${generateTimestampedFilename(filename)}"`);
  res.status(200).send(fileBuffer);
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
  getPaginatedPricingRecordsController,
  exportPricingRecordsController,
  getPricingDetailsController,
  getPriceByProductAndPriceTypeController,
};

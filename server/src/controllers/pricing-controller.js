const wrapAsync = require('../utils/wrap-async');
const {
  fetchPaginatedPricingRecordsService,
  fetchPricingDetailsByPricingTypeId,
  exportPricingRecordsService,
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
  const { exportFormat, brand, pricingType, countryCode, sizeLabel } =
    req.query;

  // Build filters object
  const filters = {
    ...(brand && { brand }),
    ...(pricingType && { pricingType }),
    ...(countryCode && { countryCode }),
    ...(sizeLabel && { sizeLabel }),
  };

  const context = 'pricing-controller/exportPricingRecordsController';

  logInfo('Starting pricing export', req, {
    context,
    exportFormat,
    filters,
  });

  // Fetch raw export data using filters
  const exportRows = await exportPricingRecordsService(filters, exportFormat);

  // Export a final file using utility (handles formatting and content-type), handles an empty case inside
  const { fileBuffer, contentType, filename } = await exportData({
    data: exportRows,
    exportFormat,
    filename: 'pricing_export',
    title: 'Pricing Export',
  });

  res.setHeader('Content-Type', contentType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${generateTimestampedFilename(filename)}"`
  );
  res.status(200).send(fileBuffer);
});

/**
 * Controller: Get pricing details by pricing type ID.
 *
 * @description Fetches paginated pricing details including product, SKU, location, status, and audit metadata.
 *
 * @route GET /api/pricing-types/:id/details
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} Responds with JSON including pricing detail records and pagination metadata.
 */
const getPricingDetailsController = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { page, limit } = req.query;

  const { data, pagination } = await fetchPricingDetailsByPricingTypeId(
    id,
    page,
    limit
  );

  return res.status(200).json({
    success: true,
    message: 'Pricing details fetched successfully',
    data,
    pagination,
  });
});

module.exports = {
  getPaginatedPricingRecordsController,
  exportPricingRecordsController,
  getPricingDetailsController,
};

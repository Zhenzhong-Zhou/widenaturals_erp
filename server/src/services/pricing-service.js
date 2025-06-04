const AppError = require('../utils/AppError');
const { sanitizeSortBy } = require('../utils/sort-utils');
const {
  getAllPricingRecords,
  getPricingDetailsByPricingTypeId,
  getActiveProductPrice,
} = require('../repositories/pricing-repository');
const {
  transformPaginatedPricingResult,
  transformExportPricingData,
  transformPricingDetailRow,
  transformPaginatedPricingDetailResult,
} = require('../transformers/pricing-transformer');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');

/**
 * Service to fetch paginated pricing records.
 *
 * Supports sorting, filtering, and keyword search across product name or SKU.
 *
 * @param {Object} options - Options for the paginated query.
 * @param {number} [options.page=1] - Current page number.
 * @param {number} [options.limit=10] - Number of records per page.
 * @param {string} [options.sortBy='brand'] - Field to sort by (must match allowed keys).
 * @param {string} [options.sortOrder='ASC'] - Sort direction ('ASC' or 'DESC').
 * @param {Object} [options.filters={}] - Optional filters (e.g., { brand, pricingType }).
 * @param {string} [options.keyword] - Optional keyword for fuzzy search.
 *
 * @returns {Promise<Object>} - Returns transformed pricing data with pagination metadata.
 */
const fetchPaginatedPricingRecordsService = async ({
  page = 1,
  limit = 10,
  sortBy = 'brand',
  sortOrder = 'ASC',
  filters = {},
  keyword,
}) => {
  // Validate inputs
  if (!Number.isInteger(page) || page < 1) {
    throw AppError.validationError(
      'Invalid page number. Must be a positive integer.'
    );
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw AppError.validationError(
      'Invalid limit. Must be a positive integer.'
    );
  }

  if (
    (filters.validFrom && !filters.validTo) ||
    (!filters.validFrom && filters.validTo)
  ) {
    throw AppError.validationError(
      'Both validFrom and validTo must be provided together for date filtering.'
    );
  }

  const sanitizedSortBy = sanitizeSortBy(sortBy, 'pricingRecords');
  const resolvedSortOrder =
    sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  try {
    const rawResult = await getAllPricingRecords({
      page,
      limit,
      sortBy: sanitizedSortBy,
      sortOrder: resolvedSortOrder,
      filters,
      keyword,
    });

    if (!rawResult || !rawResult.data || rawResult.data.length === 0) {
      return {
        success: true,
        message: 'No pricing records found.',
        data: [],
        pagination: {
          page,
          limit,
          totalRecords: 0,
          totalPages: 0,
        },
      };
    }

    return transformPaginatedPricingResult(rawResult);
  } catch (error) {
    logSystemException(error, 'Failed to fetch pricing records', {
      context: 'pricing-service/fetchPaginatedPricingRecordsService',
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
      keyword,
    });

    throw AppError.serviceError('Failed to fetch pricing records', 500, error);
  }
};

/**
 * Service to export pricing records in a format-friendly structure.
 *
 * @param {Object} filters - Filter object (e.g., brand, pricingType, etc.)
 * @param {string} format - Export format: 'csv' | 'xlsx' | 'txt'
 * @returns {Promise<Array<Object>>} - Transformed rows for export
 */
const exportPricingRecordsService = async (filters = {}, format = 'csv') => {
  logSystemInfo('Exporting pricing records', {
    context: 'pricing-service/exportPricingRecordsService',
    filters,
    format,
  });

  try {
    const rawData = await getAllPricingRecords({
      page: 1,
      limit: 10000,
      sortBy: 'brand',
      sortOrder: 'ASC',
      filters,
    });

    if (!rawData.data || rawData.data.length === 0) {
      return [];
    }

    return transformExportPricingData(rawData.data, format);
  } catch (error) {
    logSystemException(error, 'Failed to export pricing records', {
      context: 'pricing-service/exportPricingRecordsService',
      filters,
      format,
    });

    throw AppError.serviceError('Failed to export pricing records', 500, error);
  }
};

/**
 * Fetch pricing details by pricing type ID, including product, location, and audit metadata.
 *
 * @param {string} pricingTypeId - The UUID of the pricing type.
 * @param {number} page - Page number for pagination.
 * @param {number} limit - Number of records per page.
 * @returns {Promise<Object>} Paginated pricing detail records.
 * @throws {AppError} If validation fails or no records are found.
 */
const fetchPricingDetailsByPricingTypeId = async (
  pricingTypeId,
  page,
  limit
) => {
  try {
    // Input validation
    if (!pricingTypeId) {
      throw AppError.validationError('Pricing type ID is required', 400);
    }

    if (page < 1 || limit < 1) {
      throw AppError.validationError(
        'Page and limit must be positive integers',
        400
      );
    }

    logSystemInfo('Fetching pricing details by pricing type ID', {
      context: 'pricing-service/fetchPricingDetailsByPricingTypeId',
      pricingTypeId,
      page,
      limit,
    });

    // Repository fetch
    const pricingRawData = await getPricingDetailsByPricingTypeId({
      pricingTypeId,
      page,
      limit,
    });

    if (!pricingRawData.data.length || pricingRawData.data.length === 0) {
      return [];
    }

    return transformPaginatedPricingDetailResult(pricingRawData);
  } catch (error) {
    logSystemException('Failed to fetch pricing details', {
      context: 'pricing-service/fetchPricingDetailsByPricingTypeId',
      pricingTypeId,
      page,
      limit,
      error,
    });
    throw AppError.serviceError('Internal pricing fetch error', error);
  }
};

/**
 * Fetch the active price for a given product ID and price type ID.
 *
 * @param {string} productId - The ID of the product.
 * @param {string} priceTypeId - The ID of the price type.
 * @returns {Promise<{ price: number, productId: string, priceTypeId: string }>}
 * - Returns an object containing the price if found.
 * @throws {AppError} - Throws an error if the price could not be retrieved.
 */
const fetchPriceByProductAndPriceType = async (productId, priceTypeId) => {
  if (!productId || !priceTypeId) {
    throw AppError.validationError(
      'Product ID and Price Type ID are required.'
    );
  }

  try {
    const result = await getActiveProductPrice(productId, priceTypeId);

    if (!result) {
      throw AppError.notFoundError(
        `No active price found for product ${productId} with price type ${priceTypeId}.`
      );
    }

    return {
      price: result.price,
      productId,
      priceTypeId,
    };
  } catch (error) {
    throw AppError.serviceError(`Failed to fetch price: ${error.message}`);
  }
};

module.exports = {
  fetchPaginatedPricingRecordsService,
  exportPricingRecordsService,
  fetchPricingDetailsByPricingTypeId,
  fetchPriceByProductAndPriceType,
};

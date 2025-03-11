const AppError = require('../utils/AppError');
const {
  getPricings,
  getPricingDetailsByPricingId,
} = require('../repositories/pricing-repository');

/**
 * Service to fetch paginated pricing records.
 * @param {Object} options - Options for the paginated query.
 * @param {number} [options.page=1] - Current page number.
 * @param {number} [options.limit=10] - Number of records per page.
 * @returns {Promise<Object>} - Returns an object with `data` and `pagination` metadata.
 */
const fetchAllPricings = async ({ page = 1, limit = 10 }) => {
  if (!Number.isInteger(page) || page < 1) {
    throw AppError.validationError('Invalid page number. Must be a positive integer.');
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw AppError.validationError('Invalid limit. Must be a positive integer.', 400);
  }

  try {
    // Fetch data from the repository layer
    const pricingData = await getPricings({ page, limit });

    // Business Logic: Validate response data
    if (!pricingData || !pricingData.data || pricingData.data.length === 0) {
      return {
        data: [],
        pagination: {
          totalRecords: 0,
          totalPages: 0,
          currentPage: page,
          limit,
          hasNextPage: false,
          hasPrevPage: page > 1,
        },
      };
    }

    // Additional Business Logic: Example - Mask certain price values based on user role (if applicable)
    const sanitizedData = pricingData.data.map((item) => ({
      ...item,
      price: item.price ? parseFloat(item.price).toFixed(2) : 'N/A', // Ensures consistent price format
    }));

    return {
      data: sanitizedData,
      pagination: pricingData.pagination,
    };
  } catch (error) {
    throw AppError.serviceError('Failed to fetch pricing data', 500, error);
  }
};

/**
 * Fetch pricing details, including product, location, and pagination info.
 * @param {string} pricingId - The UUID of the pricing record.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The number of records per page.
 * @returns {Promise<Object>} - Returns pricing details with related product, location, and pagination info.
 */
const fetchPricingDetailsByPricingId = async (pricingId, page, limit) => {
  // Validate input
  if (!pricingId) {
    throw AppError.validationError('Pricing ID is required', 400);
  }

  if (page < 1 || limit < 1) {
    throw AppError.validationError('Page and limit must be positive integers', 400);
  }

  // Fetch pricing details from repository
  const pricingData = await getPricingDetailsByPricingId({
    pricingId,
    page,
    limit,
  });

  if (!pricingData?.data?.length) {
    throw AppError.notFoundError('Pricing details not found', 404);
  }

  const pricing = pricingData.data[0];

  // Format response
  return {
    pricing,
    pagination: pricingData.pagination,
  };
};

module.exports = {
  fetchAllPricings,
  fetchPricingDetailsByPricingId,
};

const AppError = require('../utils/AppError');
const { getPricings } = require('../repositories/pricing-repository');

/**
 * Service to fetch paginated pricing records.
 * @param {Object} options - Options for the paginated query.
 * @param {number} [options.page=1] - Current page number.
 * @param {number} [options.limit=10] - Number of records per page.
 * @returns {Promise<Object>} - Returns an object with `data` and `pagination` metadata.
 */
const fetchAllPricings = async ({ page = 1, limit = 10 }) => {
  if (!Number.isInteger(page) || page < 1) {
    throw new AppError('Invalid page number. Must be a positive integer.', 400);
  }
  
  if (!Number.isInteger(limit) || limit < 1) {
    throw new AppError('Invalid limit. Must be a positive integer.', 400);
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
    throw new AppError('Failed to fetch pricing data', 500, error);
  }
};

module.exports = {
  fetchAllPricings,
}

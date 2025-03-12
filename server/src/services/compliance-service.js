const { getAllCompliances } = require('../repositories/compliance-repository');
const AppError = require('../utils/AppError');

/**
 * Service function to fetch all compliance records with business logic.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The number of records per page.
 * @param {string} sortBy - The column to sort by.
 * @param {string} sortOrder - The order of sorting (ASC/DESC).
 * @returns {Promise<Object>} - Compliance records with pagination metadata.
 */
const fetchAllCompliances = async (page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC') => {
  try {
    // Ensure valid pagination params
    if (page < 1 || limit < 1) {
      throw AppError.validationError('Invalid pagination parameters');
    }
    
    // Fetch compliance data from repository
    const { data, pagination} = await getAllCompliances(page, limit, sortBy, sortOrder);
    
    // Structure response
    return {
      success: true,
      message: 'Compliance records retrieved successfully',
      data,
      pagination,
    };
  } catch (error) {
    throw AppError.serviceError('Failed to fetch compliance records', { cause: error });
  }
};

module.exports = {
  fetchAllCompliances,
};

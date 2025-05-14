const {
  getAllPriceTypes,
  getPricingTypeById,
  getPricingTypesForDropdown,
} = require('../repositories/pricing-type-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { logSystemInfo, logSystemError } = require('../utils/system-logger');
const {
  getPricingDetailsByPricingTypeId,
} = require('../repositories/pricing-repository');
const { canViewPricingTypes } = require('../business/pricing-type-business');
const { transformPaginatedPricingTypeResult, transformPricingTypeMetadata } = require('../transformers/pricing-type-transformer');
const { getStatusId } = require('../config/status-cache');

/**
 * Service: Fetches all pricing types with pagination and filtering.
 *
 * Applies business logic for permission checking, optional filtering,
 * and formats results using transformer utilities.
 *
 * @param {object} params - Query parameters.
 * @param {number} [params.page=1] - Page number for pagination.
 * @param {number} [params.limit=10] - Records per page.
 * @param {string} [params.name] - Optional name/code search filter.
 * @param {string} [params.startDate] - Optional filter start range (ISO date).
 * @param {string} [params.endDate] - Optional filter end range (ISO date).
 * @param {object} params.user - Authenticated user object.
 * @returns {Promise<object>} - Transformed paginated price types.
 */
const fetchAllPriceTypes = async ({
                                    page = 1,
                                    limit = 10,
                                    name,
                                    startDate,
                                    endDate,
                                    user,
                                  }) => {
  if (!user) {
    throw AppError.authenticationError('User authentication required');
  }
  
  if ((startDate && !endDate) || (!startDate && endDate)) {
    throw AppError.validationError('Both startDate and endDate must be provided together.');
  }
  
  const canViewAllStatuses = await canViewPricingTypes(user);

  // Determine effective statusId to pass to repository
  const statusId = canViewAllStatuses ? null : getStatusId('pricing_type_active');
  
  const search = name?.trim() || null;
  
  try {
    logSystemInfo('Fetching pricing types', {
      context: 'pricing-type-service',
      page,
      limit,
      statusId,
      search,
      startDate,
      endDate,
      canViewAllStatuses,
      userId: user.id,
    });
    
    const rawResult = await getAllPriceTypes({
      page,
      limit,
      statusId,
      search,
      startDate,
      endDate,
      canViewAllStatuses,
    });
    
    const result = transformPaginatedPricingTypeResult(rawResult);
    
    logSystemInfo('Successfully fetched pricing types', {
      context: 'pricing-type-service',
      resultCount: result.data.length,
    });
    
    return result;
  } catch (error) {
    logSystemError('Failed to fetch pricing types', {
      context: 'pricing-type-service',
      error,
    });
    
    throw AppError.serviceError('Failed to fetch pricing types', {
      cause: error,
    });
  }
};

/**
 * Service function to fetch pricing type metadata by ID.
 *
 * @param {string} pricingTypeId - UUID of the pricing type.
 * @returns {Promise<object>} The transformed pricing type metadata.
 * @throws {AppError} If the pricing type is not found or a database error occurs.
 */
const fetchPricingTypeByIdWithMetadataService = async (pricingTypeId) => {
  try {
    const pricingTypeRow = await getPricingTypeById(pricingTypeId);
    
    if (!pricingTypeRow) {
      throw AppError.notFoundError('Pricing type not found');
    }
    
    return transformPricingTypeMetadata(pricingTypeRow);
  } catch (error) {
    logSystemError('Failed to fetch pricing type metadata', {
      context: 'pricing-types-service/fetchPricingTypeByIdWithMetadata',
      pricingTypeId,
      error,
    });
    
    throw AppError.serviceError('Unable to retrieve pricing type metadata.', { cause: error });
  }
};

/**
 * Service function to fetch active pricing types for dropdown.
 * Applies business logic such as formatting labels and validating product ID.
 * Labels are formatted as: 'PricingTypeName - $Price'.
 *
 * @param {string} productId - The ID of the product to fetch related pricing types.
 * @returns {Promise<Array<{ id: string, label: string }>>} - List of pricing types formatted for dropdown use.
 * @throws {Error} - Throws an error if the productId is missing or fetching data fails.
 */
const fetchAvailablePricingTypesForDropdown = async (productId) => {
  try {
    if (!productId) {
      throw AppError.validationError(
        'Product ID is required to fetch pricing types.'
      );
    }

    const pricingTypes = await getPricingTypesForDropdown(productId);

    // Apply additional formatting or filtering if needed (e.g., logging, auditing)
    return pricingTypes.map((type) => ({
      id: type.id,
      label: type.label,
    }));
  } catch (error) {
    logError('Error fetching pricing types in service:', error);
    throw AppError.serviceError('Failed to fetch pricing types for dropdown');
  }
};

module.exports = {
  fetchAllPriceTypes,
  fetchPricingTypeByIdWithMetadataService,
  fetchAvailablePricingTypesForDropdown,
};

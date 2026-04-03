/**
 * @file pricing-type-service.js
 * @description Business logic for pricing type retrieval.
 *
 * Exports:
 *   - fetchAllPriceTypes                        – paginated pricing type list with access scoping
 *   - fetchPricingTypeByIdWithMetadataService   – single pricing type detail by ID
 *   - fetchAvailablePricingTypesForDropdown     – pricing types scoped to a product for dropdown use
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const {
  getAllPriceTypes,
  getPricingTypeById,
  getPricingTypesForDropdown,
}                                          = require('../repositories/pricing-type-repository');
const AppError                             = require('../utils/AppError');
const { canViewPricingTypes }              = require('../business/pricing-type-business');
const {
  transformPaginatedPricingTypeResult,
  transformPricingTypeMetadata,
}                                          = require('../transformers/pricing-type-transformer');
const { getStatusId }                      = require('../config/status-cache');

const CONTEXT = 'pricing-type-service';

/**
 * Fetches paginated pricing types with optional filtering and access-scoped status visibility.
 *
 * @param {Object}        options
 * @param {number}        [options.page=1]       - Page number (1-based).
 * @param {number}        [options.limit=10]     - Records per page.
 * @param {string|null}   [options.name]         - Optional name search string.
 * @param {string|null}   [options.startDate]    - Optional date range start (must pair with endDate).
 * @param {string|null}   [options.endDate]      - Optional date range end (must pair with startDate).
 * @param {Object}        options.user           - Authenticated user.
 *
 * @returns {Promise<PaginatedResult<Object>>}
 *
 * @throws {AppError} `authenticationError` – user is missing.
 * @throws {AppError} `validationError`     – startDate/endDate provided without its pair.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchAllPriceTypes = async ({
                                    page      = 1,
                                    limit     = 10,
                                    name,
                                    startDate,
                                    endDate,
                                    user,
                                  }) => {
  const context = `${CONTEXT}/fetchAllPriceTypes`;
  
  if (!user) {
    throw AppError.authenticationError('User authentication required.');
  }
  
  if ((startDate && !endDate) || (!startDate && endDate)) {
    throw AppError.validationError('Both startDate and endDate must be provided together.');
  }
  
  try {
    const canViewAllStatuses = await canViewPricingTypes(user);
    const statusId           = canViewAllStatuses ? null : getStatusId('pricing_type_active');
    const search             = name?.trim() || null;
    
    const rawResult = await getAllPriceTypes({
      page,
      limit,
      statusId,
      search,
      startDate,
      endDate,
      canViewAllStatuses,
    });
    
    return transformPaginatedPricingTypeResult(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch pricing types.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Fetches a single pricing type with full metadata by ID.
 *
 * @param {string} pricingTypeId - UUID of the pricing type to retrieve.
 *
 * @returns {Promise<PricingTypeDetailRecord>}
 *
 * @throws {AppError} `notFoundError` – pricing type does not exist.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPricingTypeByIdWithMetadataService = async (pricingTypeId) => {
  const context = `${CONTEXT}/fetchPricingTypeByIdWithMetadataService`;
  
  try {
    const pricingTypeRow = await getPricingTypeById(pricingTypeId);
    
    if (!pricingTypeRow) {
      throw AppError.notFoundError('Pricing type not found.');
    }
    
    return transformPricingTypeMetadata(pricingTypeRow);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to retrieve pricing type metadata.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Fetches available pricing types scoped to a product for dropdown use.
 *
 * @param {string} productId - UUID of the product to scope pricing types for.
 *
 * @returns {Promise<Array<{ id: string, label: string }>>}
 *
 * @throws {AppError} `validationError` – productId is missing.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchAvailablePricingTypesForDropdown = async (productId) => {
  const context = `${CONTEXT}/fetchAvailablePricingTypesForDropdown`;
  
  if (!productId) {
    throw AppError.validationError('Product ID is required to fetch pricing types.');
  }
  
  try {
    const pricingTypes = await getPricingTypesForDropdown(productId);
    
    return pricingTypes.map((type) => ({
      id:    type.id,
      label: type.label,
    }));
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch pricing types for dropdown.', {
      meta: { error: error.message, context },
    });
  }
};

module.exports = {
  fetchAllPriceTypes,
  fetchPricingTypeByIdWithMetadataService,
  fetchAvailablePricingTypesForDropdown,
};

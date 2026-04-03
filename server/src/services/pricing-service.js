/**
 * @file pricing-service.js
 * @description Business logic for pricing record retrieval and export.
 *
 * Exports:
 *   - fetchPaginatedPricingRecordsService  – paginated pricing list with filtering and sorting
 *   - exportPricingRecordsService          – full pricing export (up to 10,000 records)
 *   - fetchPricingDetailsByPricingTypeId   – paginated pricing details scoped to a pricing type
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const AppError                             = require('../utils/AppError');
const { sanitizeSortBy }                   = require('../utils/query/sort-resolver');
const {
  getPaginatedPricings,
  exportAllPricingRecords,
  getPricingDetailsByPricingTypeId,
}                                          = require('../repositories/pricing-repository');
const {
  transformPaginatedPricingResult,
  transformExportPricingData,
  transformPaginatedPricingDetailResult,
}                                          = require('../transformers/pricing-transformer');

const CONTEXT = 'pricing-service';

/**
 * Fetches paginated pricing records with optional filtering and sorting.
 *
 * Input validation is performed before the try/catch — guards are not
 * error handling, they are pre-conditions.
 *
 * @param {Object}        options
 * @param {number}        [options.page=1]          - Page number (1-based).
 * @param {number}        [options.limit=10]        - Records per page.
 * @param {string}        [options.sortBy='brand']  - Sort field key.
 * @param {'ASC'|'DESC'}  [options.sortOrder='ASC'] - Sort direction.
 * @param {Object}        [options.filters={}]      - Field filters.
 * @param {string|null}   [options.keyword]         - Optional keyword search.
 *
 * @returns {Promise<PaginatedResult<Object>>}
 *
 * @throws {AppError} `validationError`  – invalid page, limit, or date range.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedPricingRecordsService = async ({
                                                     page      = 1,
                                                     limit     = 10,
                                                     sortBy    = 'brand',
                                                     sortOrder = 'ASC',
                                                     filters   = {},
                                                     keyword,
                                                   }) => {
  const context = `${CONTEXT}/fetchPaginatedPricingRecordsService`;
  
  if (!Number.isInteger(page) || page < 1) {
    throw AppError.validationError('Invalid page number. Must be a positive integer.');
  }
  
  if (!Number.isInteger(limit) || limit < 1) {
    throw AppError.validationError('Invalid limit. Must be a positive integer.');
  }
  
  if ((filters.validFrom && !filters.validTo) || (!filters.validFrom && filters.validTo)) {
    throw AppError.validationError(
      'Both validFrom and validTo must be provided together for date filtering.'
    );
  }
  
  try {
    const sanitizedSortBy    = sanitizeSortBy(sortBy, 'pricingSortMap');
    const resolvedSortOrder  = sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    const rawResult = await getPaginatedPricings({
      page,
      limit,
      sortBy:    sanitizedSortBy,
      sortOrder: resolvedSortOrder,
      filters,
      keyword,
    });
    
    // Return standard empty shape — no special success/message fields.
    if (!rawResult || !rawResult.data || rawResult.data.length === 0) {
      return {
        data:       [],
        pagination: { page, limit, totalRecords: 0, totalPages: 0 },
      };
    }
    
    return transformPaginatedPricingResult(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch pricing records.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Exports all pricing records up to a hard limit of 10,000 rows.
 *
 * @param {Object} [filters={}] - Field filters to apply.
 *
 * @returns {Promise<Array<Object>>} Flat export-friendly rows, or empty array if none found.
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const exportPricingRecordsService = async (filters = {}) => {
  const context = `${CONTEXT}/exportPricingRecordsService`;
  
  try {
    const rows = await exportAllPricingRecords({
      page:      1,
      limit:     10000,
      sortBy:    'brand',
      sortOrder: 'ASC',
      filters,
    });
    
    if (!rows.length) return [];
    
    return transformExportPricingData(rows);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to export pricing records.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Fetches paginated pricing details scoped to a pricing type.
 *
 * @param {string} pricingTypeId - UUID of the pricing type to scope results.
 * @param {number} page          - Page number (1-based).
 * @param {number} limit         - Records per page.
 *
 * @returns {Promise<PaginatedResult<Object>|[]>} Transformed detail records, or empty array if none found.
 *
 * @throws {AppError} `validationError`  – missing pricing type ID or invalid page/limit.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPricingDetailsByPricingTypeId = async (pricingTypeId, page, limit) => {
  const context = `${CONTEXT}/fetchPricingDetailsByPricingTypeId`;
  
  if (!pricingTypeId) {
    throw AppError.validationError('Pricing type ID is required.');
  }
  
  if (page < 1 || limit < 1) {
    throw AppError.validationError('Page and limit must be positive integers.');
  }
  
  try {
    const pricingRawData = await getPricingDetailsByPricingTypeId({ pricingTypeId, page, limit });
    
    if (pricingRawData.data.length === 0) return [];
    
    return transformPaginatedPricingDetailResult(pricingRawData);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch pricing details.', {
      meta: { error: error.message, context },
    });
  }
};

module.exports = {
  fetchPaginatedPricingRecordsService,
  exportPricingRecordsService,
  fetchPricingDetailsByPricingTypeId,
};

/**
 * @file bom-service.js
 * @description Business logic for BOM retrieval and production readiness.
 *
 * Exports:
 *   - fetchPaginatedBomsService          – paginated BOM list with filtering and sorting
 *   - fetchBomDetailsService             – full BOM detail with cost summary enrichment
 *   - fetchBOMProductionSummaryService   – production readiness report for a given BOM
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers (repository, business) are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const {
  getPaginatedBoms,
  getBomDetailsById,
  getBomProductionSummary,
}                                        = require('../repositories/bom-repository');
const {
  transformPaginatedOBoms,
  transformBomDetails,
  transformBOMProductionSummaryRows,
  buildBOMProductionSummaryResponse,
}                                        = require('../transformers/bom-transformer');
const {
  computeEstimatedBomCostSummary,
  getProductionReadinessReport,
}                                        = require('../business/bom-business');
const AppError                           = require('../utils/AppError');

/**
 * Fetches paginated BOM records with optional filtering and sorting.
 *
 * @param {Object}        options
 * @param {Object}        [options.filters={}]    - Field filters to apply.
 * @param {number}        [options.page=1]        - Page number (1-based).
 * @param {number}        [options.limit=10]      - Records per page.
 * @param {string}        [options.sortBy]        - Sort field key (validated against sort map).
 * @param {'ASC'|'DESC'}  [options.sortOrder='DESC'] - Sort direction.
 *
 * @returns {Promise<PaginatedResult<Object>>} Transformed BOM records and pagination metadata.
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedBomsService = async ({
                                           filters   = {},
                                           page      = 1,
                                           limit     = 10,
                                           sortBy,
                                           sortOrder = 'DESC',
                                         }) => {
  try {
    const rawResult = await getPaginatedBoms({ filters, page, limit, sortBy, sortOrder });
    return transformPaginatedOBoms(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch BOM list.', {
      meta: { error: error.message },
    });
  }
};

/**
 * Fetches full BOM detail rows, transforms them into a structured result,
 * and attaches an aggregated cost summary.
 *
 * @param {string} bomId - UUID of the BOM to retrieve.
 *
 * @returns {Promise<Object>} Structured BOM detail with header, details, and cost summary.
 *
 * @throws {AppError} `notFoundError` – no rows returned for the given BOM ID.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchBomDetailsService = async (bomId) => {
  try {
    const rawData = await getBomDetailsById(bomId);
    
    if (!rawData || rawData.length === 0) {
      throw AppError.notFoundError('No BOM details found for the provided BOM ID.');
    }
    
    const structuredResult = transformBomDetails(rawData);
    
    // Attach aggregated cost summary if the business function is available.
    structuredResult.summary = computeEstimatedBomCostSummary(structuredResult) ?? null;
    
    return structuredResult;
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch BOM details.', {
      meta: { error: error.message },
    });
  }
};

/**
 * Fetches raw production summary rows, transforms them into structured part summaries,
 * applies business logic for readiness and shortages, and returns the final report.
 *
 * @param {string} bomId - UUID of the BOM to generate a production readiness report for.
 *
 * @returns {Promise<Object>} Structured production readiness response with metadata and parts.
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchBOMProductionSummaryService = async (bomId) => {
  try {
    // 1. Fetch raw rows from repository.
    const rawData = await getBomProductionSummary(bomId);
    
    // 2. Transform flat rows into structured part summaries.
    const transformedSummary = transformBOMProductionSummaryRows(rawData);
    
    // 3. Apply business logic — capacity, shortages, bottlenecks.
    const readinessReport = getProductionReadinessReport(transformedSummary);
    
    // 4. Build and return final API response shape.
    return buildBOMProductionSummaryResponse(bomId, readinessReport);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch BOM production summary.', {
      meta: { error: error.message },
    });
  }
};

module.exports = {
  fetchPaginatedBomsService,
  fetchBomDetailsService,
  fetchBOMProductionSummaryService,
};

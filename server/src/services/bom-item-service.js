/**
 * @file bom-item-service.js
 * @description Business logic for BOM material supply detail retrieval.
 *
 * Exports:
 *   - fetchBomMaterialSupplyDetailsService – fetches, transforms, and enriches
 *     BOM material supply details with aggregated cost summary
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers (repository, business) are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const {
  getBomMaterialSupplyDetailsById,
}                                    = require('../repositories/bom-item-repository');
const {
  transformBomMaterialSupplyDetails,
}                                    = require('../transformers/bom-item-transformer');
const {
  calculateBomMaterialCostsBusiness,
}                                    = require('../business/bom-item-business');
const AppError                       = require('../utils/AppError');

/**
 * Fetches raw BOM material supply rows, transforms them into a structured
 * nested format, and attaches an aggregated cost summary.
 *
 * @param {string} bomId - UUID of the BOM record to retrieve supply details for.
 *
 * @returns {Promise<Array<Object>>} Structured BOM material supply entries with cost summary.
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchBomMaterialSupplyDetailsService = async (bomId) => {
  try {
    // 1. Fetch raw rows from repository.
    const rows = await getBomMaterialSupplyDetailsById(bomId);
    
    // 2. Transform flat rows into structured nested format.
    const structuredResult = transformBomMaterialSupplyDetails(rows);
    
    // 3. Attach aggregated cost summary.
    structuredResult.summary = calculateBomMaterialCostsBusiness(
      bomId,
      structuredResult
    );
    
    return structuredResult;
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch BOM material supply details.', {
      meta: { error: error.message },
    });
  }
};

module.exports = {
  fetchBomMaterialSupplyDetailsService,
};

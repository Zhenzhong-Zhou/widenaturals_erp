const {
  getBomMaterialSupplyDetailsById,
} = require('../repositories/bom-item-repository');
const {
  transformBomMaterialSupplyDetails,
} = require('../transformers/bom-item-transformer');
const {
  calculateBomMaterialCostsBusiness,
} = require('../business/bom-item-business');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Service: Fetch BOM Material Supply Details
 * ------------------------------------------
 * - Retrieves full BOM item composition with associated packaging materials, suppliers, and batches.
 * - Transforms raw SQL rows into a structured hierarchical object.
 * - Calculates total material cost summary (estimated vs. actual) in system base currency.
 *
 * @async
 * @function
 * @param {string} bomId - The BOM ID to fetch details for.
 * @returns {Promise<Object>} Structured BOM material supply details including cost summary.
 * @throws {AppError} When repository, transformation, or business logic fails.
 */
const fetchBomMaterialSupplyDetailsService = async (bomId) => {
  try {
    // --- 1. Fetch raw data from repository ---
    const rows = await getBomMaterialSupplyDetailsById(bomId);

    logSystemInfo('Fetched raw BOM material supply data', {
      context: 'bom-item-service/fetchBomMaterialSupplyDetailsService',
      bomId,
      recordCount: rows?.length || 0,
    });

    // --- 2. Transform into structured nested format ---
    const structuredResult = transformBomMaterialSupplyDetails(rows);

    // --- 3. Compute cost summary (aggregated totals) ---
    structuredResult.summary = calculateBomMaterialCostsBusiness(
      bomId,
      structuredResult
    );

    logSystemInfo('Successfully built BOM material supply structure', {
      context: 'bom-item-service/fetchBomMaterialSupplyDetailsService',
      bomId,
      hasSummary: !!structuredResult.summary,
    });

    return structuredResult;
  } catch (error) {
    // --- 4. Structured exception logging ---
    logSystemException(
      error,
      'Failed to fetch or transform BOM material supply details',
      {
        context: 'bom-item-service/fetchBomMaterialSupplyDetailsService',
        bomId,
        severity: 'error',
      }
    );

    // --- 5. Unified service-layer error rethrow ---
    throw AppError.serviceError(
      'Unable to fetch BOM material supply details.',
      {
        bomId,
        hint: 'Verify BOM ID exists and repository query joins are valid.',
        cause: error.message,
      }
    );
  }
};

module.exports = {
  fetchBomMaterialSupplyDetailsService,
};

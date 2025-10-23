const { convertToBaseCurrency } = require('../utils/currency-utils');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Business: Calculate total BOM material cost summary.
 *
 * - Converts all costs to system base currency.
 * - Uses actual batch/supplier/estimated hierarchy for cost resolution.
 * - Returns only aggregated totals (no enriched BOM data).
 *
 * @param {string} bomId - The BOM ID being analyzed.
 * @param {Array<Object>} bomItems - Transformed BOM items (from transformer).
 * @param {string} [systemBaseCurrency='CAD'] - Default system currency for normalization.
 * @returns {Object} BOM-level cost summary.
 */
const calculateBomMaterialCostsBusiness = (
  bomId,
  bomItems = [],
  systemBaseCurrency = 'CAD'
) => {
  try {
    const round = (num) => Number((num ?? 0).toFixed(4));
    
    let totalEstimatedCost = 0;
    let totalActualCost = 0;
    
    for (const item of bomItems) {
      for (const mat of item.packagingMaterials || []) {
        const quantityPerBom = item.bomItemMaterial?.quantity ?? 1;
        
        // Extract cost data
        const estimatedUnitCost = mat.estimatedUnitCost ?? 0;
        const estimatedCurrency = mat.currency ?? systemBaseCurrency;
        const estimatedExchange = mat.exchangeRate ?? 1;
        
        const batch = mat?.supplier?.batches?.[0];
        const supplier = mat?.supplier?.contract;
        
        const batchCost = batch?.unitCost ?? null;
        const batchCurrency = batch?.currency ?? null;
        const batchExchange = batch?.exchangeRate ?? null;
        
        const supplierCost = supplier?.unitCost ?? null;
        const supplierCurrency = supplier?.currency ?? null;
        const supplierExchange = supplier?.exchangeRate ?? null;
        
        // Determine final unit cost
        let actualUnitCost = estimatedUnitCost;
        let actualCurrency = estimatedCurrency;
        let actualExchange = estimatedExchange;
        
        if (batchCost != null) {
          actualUnitCost = batchCost;
          actualCurrency = batchCurrency ?? estimatedCurrency;
          actualExchange = batchExchange ?? 1;
        } else if (supplierCost != null) {
          actualUnitCost = supplierCost;
          actualCurrency = supplierCurrency ?? estimatedCurrency;
          actualExchange = supplierExchange ?? 1;
        }
        
        // Convert all to base currency
        const estimatedCostBase = convertToBaseCurrency(
          estimatedUnitCost * quantityPerBom,
          estimatedCurrency,
          estimatedExchange,
          systemBaseCurrency
        );
        const actualCostBase = convertToBaseCurrency(
          actualUnitCost * quantityPerBom,
          actualCurrency,
          actualExchange,
          systemBaseCurrency
        );
        
        totalEstimatedCost += estimatedCostBase;
        totalActualCost += actualCostBase;
      }
    }
    
    return {
      bomId,
      baseCurrency: systemBaseCurrency,
      totalEstimatedCost: round(totalEstimatedCost),
      totalActualCost: round(totalActualCost),
      variance: round(totalActualCost - totalEstimatedCost),
      variancePercentage: totalEstimatedCost
        ? round(((totalActualCost - totalEstimatedCost) / totalEstimatedCost) * 100)
        : 0,
    };
  } catch (error) {
    logSystemException(error, 'Failed to calculate BOM material costs', {
      context: 'bom-item-business/calculateBomMaterialCostsBusiness',
      bomId,
      severity: 'error',
    });
    
    throw AppError.businessError('Failed to calculate BOM material costs', {
      bomId,
      hint: 'Ensure supplier or batch costs are properly linked and currency rates are provided.',
    });
  }
};

module.exports = {
  calculateBomMaterialCostsBusiness,
};

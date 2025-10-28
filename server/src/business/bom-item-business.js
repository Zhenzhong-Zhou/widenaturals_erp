const { convertToBaseCurrency } = require('../utils/currency-utils');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Business Logic: Calculate total BOM material cost summary (Option B: preferred supplier).
 *
 * - Converts all costs into the system base currency.
 * - Resolves cost using this hierarchy:
 *   Batch → Preferred Supplier → Estimated Unit Cost.
 * - Aggregates totals by part and supplier (one supplier per part).
 * - Returns a BOM-level summary ready for reporting or roll-up costing.
 *
 * Future Extension (Option A):
 *   Expand this function to support multi-supplier cost aggregation
 *   and detailed analytics such as per-supplier or per-batch variance.
 *
 * @param {string} bomId - The BOM ID being analyzed.
 * @param {Array<Object>} bomItems - Transformed BOM items (from transformer).
 * @param {string} [systemBaseCurrency='CAD'] - System base currency for normalization.
 * @param {Object} [options] - Optional settings.
 * @param {"preferred"|"aggregate"} [options.mode='preferred']
 *   Mode selector: 'preferred' (current Option B) or 'aggregate' (future Option A).
 * @returns {Object} BOM-level cost summary with totals, supplier totals, and part totals.
 */
const calculateBomMaterialCostsBusiness = (
  bomId,
  bomItems = [],
  systemBaseCurrency = 'CAD',
  options = { mode: 'preferred' }
) => {
  try {
    const { mode } = options;
    const round = (num) => Number((num ?? 0).toFixed(6));
    
    let totalEstimatedCost = 0;
    let totalActualCost = 0;
    const supplierTotals = new Map();
    const partTotals = new Map();
    
    for (const item of bomItems) {
      const partId = item.part?.id;
      let partTotal = 0;
      
      for (const mat of item.packagingMaterials || []) {
        // Option B: use preferred or first supplier
        let supplier = null;
        if (Array.isArray(mat.suppliers) && mat.suppliers.length > 0) {
          supplier =
            mode === 'preferred'
              ? mat.suppliers.find((s) => s.contract?.isPreferred) || mat.suppliers[0]
              : mat.suppliers[0];
        } else {
          supplier = mat.supplier; // fallback to old single-supplier structure
        }
        
        const quantityPerBom = item.bomItemMaterial?.requiredQtyPerProduct ?? 1;
        
        // Extract cost data
        const estimatedUnitCost = mat.estimatedUnitCost ?? 0;
        const estimatedCurrency = mat.currency ?? systemBaseCurrency;
        const estimatedExchange = mat.exchangeRate ?? 1;
        
        const supplierCost = supplier?.contract?.unitCost ?? null;
        const supplierCurrency = supplier?.contract?.currency ?? estimatedCurrency;
        const supplierExchange = supplier?.contract?.exchangeRate ?? 1;
        
        // Select active cost source
        const actualUnitCost = supplierCost ?? estimatedUnitCost;
        const actualCurrency = supplierCost ? supplierCurrency : estimatedCurrency;
        const actualExchange = supplierCost ? supplierExchange : estimatedExchange;
        
        // Normalize to base currency
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
        partTotal += actualCostBase;
        
        // Track per-supplier totals
        if (supplier.id) {
          supplierTotals.set(
            supplier.id,
            (supplierTotals.get(supplier.id) || 0) + actualCostBase
          );
        }
      }
      
      if (partId) {
        partTotals.set(partId, (partTotals.get(partId) || 0) + partTotal);
      }
    }
    
    // --- Structured summary output ---
    const suppliers = Array.from(supplierTotals.entries()).map(([id, totalCost]) => ({
      id,
      totalCost: round(totalCost),
    }));
    
    const parts = Array.from(partTotals.entries()).map(([partId, totalCost]) => ({
      partId,
      totalCost: round(totalCost),
    }));
    
    return {
      bomId,
      baseCurrency: systemBaseCurrency,
      totals: {
        totalEstimatedCost: round(totalEstimatedCost),
        totalActualCost: round(totalActualCost),
        variance: round(totalActualCost - totalEstimatedCost),
        variancePercentage: totalEstimatedCost
          ? round(((totalActualCost - totalEstimatedCost) / totalEstimatedCost) * 100)
          : 0,
      },
      suppliers,
      parts,
    };
  } catch (error) {
    logSystemException(error, 'Failed to calculate BOM material cost summary', {
      context: 'bom-item-business/calculateBomMaterialCostsBusiness',
      bomId,
      severity: 'error',
    });
    
    throw AppError.businessError('Unable to complete BOM cost calculation', {
      bomId,
      hint:
        'Check supplier or batch cost links and ensure currency exchange rates are defined. ' +
        'Current mode: preferred-supplier (Option B).',
    });
  }
};

module.exports = {
  calculateBomMaterialCostsBusiness,
};

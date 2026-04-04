/**
 * @file bom-item-business.js
 * @description Domain business logic for BOM item cost calculation, including
 * per-part and per-supplier cost aggregation with currency normalization.
 */

'use strict';

const { convertToBaseCurrency } = require('../utils/currency-utils');

/**
 * Calculates a structured BOM material cost summary from a list of BOM items.
 *
 * Costs are normalized to `systemBaseCurrency` via exchange rates. For each
 * packaging material, the preferred supplier contract cost is used when
 * available — falling back to the first supplier, then to the material's
 * estimated unit cost.
 *
 * Aggregates:
 * - Total estimated cost (always from material estimated unit cost)
 * - Total actual cost (from supplier contract cost when available)
 * - Variance between estimated and actual
 * - Per-supplier cost totals
 * - Per-part cost totals
 *
 * @param {string} bomId - UUID of the BOM record.
 * @param {object[]} [bomItems=[]] - Array of BOM item objects with nested
 *   packaging materials and supplier contracts.
 * @param {string} [systemBaseCurrency='CAD'] - Target currency for normalization.
 * @param {object} [options={ mode: 'preferred' }]
 * @param {'preferred' | 'first'} [options.mode='preferred'] - Supplier selection
 *   strategy. `'preferred'` selects the preferred contract supplier if one exists,
 *   otherwise falls back to the first. `'first'` always uses the first supplier.
 * @returns {{
 *   bomId: string,
 *   baseCurrency: string,
 *   totals: {
 *     totalEstimatedCost: number,
 *     totalActualCost: number,
 *     variance: number,
 *     variancePercentage: number,
 *   },
 *   suppliers: { id: string, name: string, supplierTotalActualCost: number }[],
 *   parts: { partId: string, partName: string, materialName: string | null, displayName: string, partTotalContractCost: number }[],
 * }}
 */
const calculateBomMaterialCosts = (
  bomId,
  bomItems = [],
  systemBaseCurrency = 'CAD',
  options = { mode: 'preferred' }
) => {
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
      // Resolve supplier — preferred contract first, then first in list, then
      // single-supplier fallback for legacy data shapes.
      let supplier = null;
      if (Array.isArray(mat.suppliers) && mat.suppliers.length > 0) {
        supplier =
          mode === 'preferred'
            ? mat.suppliers.find((s) => s.contract?.isPreferred) ||
            mat.suppliers[0]
            : mat.suppliers[0];
      } else {
        supplier = mat.supplier ?? null;
      }
      
      const quantityPerBom = item.bomItemMaterial?.requiredQtyPerProduct ?? 1;
      
      const estimatedUnitCost = mat.estimatedUnitCost ?? 0;
      const estimatedCurrency = mat.currency ?? systemBaseCurrency;
      const estimatedExchange = mat.exchangeRate ?? 1;
      
      const supplierCost     = supplier?.contract?.unitCost ?? null;
      const supplierCurrency = supplier?.contract?.currency ?? estimatedCurrency;
      const supplierExchange = supplier?.contract?.exchangeRate ?? 1;
      
      // Use supplier contract cost when available, otherwise fall back to estimate.
      const actualUnitCost = supplierCost ?? estimatedUnitCost;
      const actualCurrency = supplierCost ? supplierCurrency : estimatedCurrency;
      const actualExchange = supplierCost ? supplierExchange : estimatedExchange;
      
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
      totalActualCost    += actualCostBase;
      partTotal          += actualCostBase;
      
      if (supplier?.id) {
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
  
  const suppliers = Array.from(supplierTotals.entries()).map(
    ([id, totalCost]) => {
      const supplier = bomItems
        .flatMap((b) => b.packagingMaterials)
        .map((m) => m.supplier)
        .find((s) => s?.id === id);
      return {
        id,
        name: supplier?.name || 'Unknown Supplier',
        supplierTotalActualCost: round(totalCost),
      };
    }
  );
  
  const parts = Array.from(partTotals.entries()).map(([partId, totalCost]) => {
    const bomItem     = bomItems.find((b) => b.part?.id === partId);
    const mainMaterial = bomItem?.packagingMaterials?.[0];
    return {
      partId,
      partName: bomItem?.part?.name || 'Unknown Part',
      materialName: mainMaterial?.name || null,
      displayName: mainMaterial?.name || bomItem?.part?.name,
      partTotalContractCost: round(totalCost),
    };
  });
  
  return {
    bomId,
    baseCurrency: systemBaseCurrency,
    totals: {
      totalEstimatedCost: round(totalEstimatedCost),
      totalActualCost: round(totalActualCost),
      variance: round(totalActualCost - totalEstimatedCost),
      variancePercentage: totalEstimatedCost
        ? round(
          ((totalActualCost - totalEstimatedCost) / totalEstimatedCost) * 100
        )
        : 0,
    },
    suppliers,
    parts,
  };
};

module.exports = {
  calculateBomMaterialCosts,
};

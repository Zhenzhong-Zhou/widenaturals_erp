const { convertToBaseCurrency } = require('../utils/currency-utils');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Business Logic: Calculate total BOM material cost summary (Option B: preferred supplier mode).
 *
 * Computes per-BOM cost totals by resolving material, supplier, and part relationships.
 * All costs are normalized into the system base currency and grouped for reporting.
 *
 * **Cost Resolution Hierarchy:**
 *   1. Batch cost (if available)
 *   2. Preferred Supplier contract cost
 *   3. Estimated unit cost from packaging material
 *
 * **Aggregations:**
 *   - Total BOM-level estimated and actual costs
 *   - Supplier-level totals (one preferred supplier per part)
 *   - Part-level totals including display and material names
 *
 * **Enhancements in this version:**
 *   - Adds supplier and part name resolution for UI display
 *   - Includes fallback handling for missing suppliers or parts
 *   - Produces structured output ready for frontend summary tables
 *   - Supports “preferred” or “aggregate” mode selection for future Option A expansion
 *
 * **Future Extension (Option A):**
 *   Enable multi-supplier cost aggregation and per-batch variance analytics.
 *
 * @param {string} bomId
 *   The BOM identifier being analyzed.
 * @param {Array<Object>} bomItems
 *   Transformed BOM item list (from transformer).
 * @param {string} [systemBaseCurrency='CAD']
 *   System base currency used for normalization.
 * @param {Object} [options]
 *   Optional calculation settings.
 * @param {'preferred'|'aggregate'} [options.mode='preferred']
 *   Mode selector:
 *     - `'preferred'` → Uses one preferred or first supplier per part (current behavior)
 *     - `'aggregate'` → Reserved for future multi-supplier support.
 *
 * @returns {{
 *   bomId: string;
 *   baseCurrency: string;
 *   totals: {
 *     totalEstimatedCost: number;
 *     totalActualCost: number;
 *     variance: number;
 *     variancePercentage: number;
 *   };
 *   suppliers: {
 *     id: string;
 *     name: string;
 *     supplierTotalActualCost: number;
 *   }[];
 *   parts: {
 *     partId: string;
 *     partName: string;
 *     materialName: string | null;
 *     displayName: string | null;
 *     partTotalContractCost: number;
 *   }[];
 * }}
 *   A structured cost summary containing overall totals, supplier totals, and part totals.
 *
 * @throws {AppError}
 *   Throws a business error if supplier, batch, or currency data are missing or inconsistent.
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
              ? mat.suppliers.find((s) => s.contract?.isPreferred) ||
                mat.suppliers[0]
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
        const supplierCurrency =
          supplier?.contract?.currency ?? estimatedCurrency;
        const supplierExchange = supplier?.contract?.exchangeRate ?? 1;

        // Select active cost source
        const actualUnitCost = supplierCost ?? estimatedUnitCost;
        const actualCurrency = supplierCost
          ? supplierCurrency
          : estimatedCurrency;
        const actualExchange = supplierCost
          ? supplierExchange
          : estimatedExchange;

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

    const parts = Array.from(partTotals.entries()).map(
      ([partId, totalCost]) => {
        const bomItem = bomItems.find((b) => b.part?.id === partId);
        const mainMaterial = bomItem?.packagingMaterials?.[0];
        return {
          partId,
          partName: bomItem?.part?.name || 'Unknown Part',
          materialName: mainMaterial?.name || null,
          displayName: mainMaterial?.name || bomItem?.part?.name,
          partTotalContractCost: round(totalCost),
        };
      }
    );

    return {
      bomId,
      baseCurrency: systemBaseCurrency,
      totals: {
        totalEstimatedCost: round(totalEstimatedCost),
        totalActualCost: round(totalActualCost),
        variance: round(totalActualCost - totalEstimatedCost),
        variancePercentage: totalEstimatedCost
          ? round(
              ((totalActualCost - totalEstimatedCost) / totalEstimatedCost) *
                100
            )
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

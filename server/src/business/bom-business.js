/**
 * @file bom-business.js
 * @description Domain business logic for Bill of Materials (BOM) cost estimation,
 * production readiness analysis, material utilization, shortage detection,
 * stock health, and bottleneck identification.
 */

'use strict';

/**
 * Coerces a value to a finite number, returning `fallback` if the result is
 * not finite (e.g. NaN, Infinity).
 *
 * @param {*} v - Value to coerce.
 * @param {number} [fallback=0] - Value to return if coercion fails.
 * @returns {number}
 */
const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Computes an estimated total BOM cost by multiplying each item's quantity
 * per product by its estimated unit cost, normalizing to `baseCurrency` via
 * exchange rate where the item currency differs.
 *
 * Returns a zero-cost summary if no BOM item details are present.
 *
 * @param {object} structuredResult - BOM query result with a `details` array.
 * @param {string} [baseCurrency='CAD'] - Target currency for normalization.
 * @returns {{ type: string, description: string, totalEstimatedCost: number, currency: string, itemCount: number }}
 */
const computeEstimatedBomCostSummary = (
  structuredResult,
  baseCurrency = 'CAD'
) => {
  if (!structuredResult?.details?.length) {
    return {
      type: 'ESTIMATED',
      description: 'No BOM item details found. Estimated cost unavailable.',
      totalEstimatedCost: 0,
      currency: baseCurrency,
      itemCount: 0,
    };
  }
  
  let total = 0;
  
  for (const item of structuredResult.details) {
    const qty      = Number(item.partQtyPerProduct ?? 1);
    const cost     = Number(item.estimatedUnitCost ?? 0);
    const currency = item.currency ?? baseCurrency;
    const rate     = Number(item.exchangeRate ?? 1);
    
    const amount    = qty * cost;
    const converted = currency === baseCurrency ? amount : amount * rate;
    
    total += converted;
  }
  
  return {
    type: 'ESTIMATED',
    description:
      'Calculated using estimated_unit_cost with exchange rate normalization.',
    totalEstimatedCost: Number(total.toFixed(4)),
    currency: baseCurrency,
    itemCount: structuredResult.details.length,
  };
};

/**
 * Identifies BOM summary parts that are in shortage — either explicitly flagged
 * or where available quantity is less than the required quantity per unit.
 *
 * @param {object[]} [summary=[]] - Array of BOM part summary objects.
 * @returns {object[]} Array of parts in shortage.
 */
const identifyShortageParts = (summary = []) =>
  Array.isArray(summary)
    ? summary.filter(
      (p) =>
        (p.isShortage ?? false) ||
        toNumber(p.totalAvailableQuantity) < toNumber(p.requiredQtyPerUnit)
    )
    : [];

/**
 * Calculates material utilization for each BOM part against a target
 * production quantity.
 *
 * @param {object[]} [summary=[]] - Array of BOM part summary objects.
 * @param {number} [targetQty=0] - Target number of units to produce.
 * @returns {object[]} Array of utilization records per part.
 */
const calculateMaterialUtilization = (summary = [], targetQty = 0) => {
  if (!Array.isArray(summary) || targetQty <= 0) return [];
  
  return summary.map((p) => {
    const required  = Number(p.requiredQtyPerUnit) || 0;
    const available = Number(p.totalAvailableQuantity) || 0;
    const needed    = targetQty * required;
    
    return {
      partId: p.partId,
      partName: p.partName,
      requiredQtyPerUnit: required,
      quantityNeeded: needed,
      availableQty: available,
      remainingAfterProduction: available - needed,
      isSufficient: available >= needed,
    };
  });
};

/**
 * Calculates total usable and inactive stock quantities across all parts
 * by inspecting their material batch records.
 *
 * @param {object[]} [summary=[]] - Array of BOM part summary objects, each
 *   with a `materialBatches` array.
 * @returns {{ usable: number, inactive: number }}
 */
const calculateInactiveStockImpact = (summary = []) => {
  const totals = { usable: 0, inactive: 0 };
  
  for (const part of summary) {
    const batches = Array.isArray(part.materialBatches)
      ? part.materialBatches
      : [];
    for (const batch of batches) {
      const qty = Number(batch.availableQuantity) || 0;
      if (batch.inventoryStatus !== 'in_stock') totals.inactive += qty;
      else totals.usable += qty;
    }
  }
  
  return totals;
};

/**
 * Calculates the maximum number of complete units that can be manufactured
 * given current available stock, limited by the most constrained BOM part.
 *
 * @param {object[]} [bomSummary=[]] - Array of BOM part summary objects.
 * @returns {number} Maximum producible units, or `0` if none are possible.
 */
const calculateMaxManufacturableUnits = (bomSummary = []) => {
  if (!Array.isArray(bomSummary) || bomSummary.length === 0) return 0;
  
  const limits = bomSummary.map((p) => {
    const available = toNumber(p.totalAvailableQuantity);
    // Minimum of 0.0001 prevents divide-by-zero for parts with zero required qty.
    const required  = Math.max(toNumber(p.requiredQtyPerUnit), 0.0001);
    return Math.floor(available / required);
  });
  
  const min = Math.min(...limits);
  return Number.isFinite(min) ? min : 0;
};

/**
 * Annotates each BOM part with an `isBottleneck` flag — true when the part's
 * `maxProducibleUnits` equals the overall minimum across all parts.
 *
 * @param {object[]} [summary=[]] - Array of BOM part summary objects.
 * @returns {object[]} Annotated copy of the summary array.
 */
const markBottleneckParts = (summary = []) => {
  if (!Array.isArray(summary) || summary.length === 0) return [];
  
  const minUnits = Math.min(
    ...summary.map((p) => toNumber(p.maxProducibleUnits))
  );
  
  return summary.map((p) => ({
    ...p,
    isBottleneck: toNumber(p.maxProducibleUnits) === minUnits,
  }));
};

/**
 * Generates a production readiness report from a BOM part summary array.
 *
 * Annotates parts with bottleneck flags, computes max producible units,
 * identifies shortage and bottleneck parts, and evaluates stock health.
 *
 * Returns `null` if `inputSummary` is not an array.
 *
 * @param {object[]} [inputSummary=[]] - Array of BOM part summary objects.
 * @returns {{
 *   summary: object[],
 *   maxProducibleUnits: number,
 *   shortageParts: object[],
 *   bottleneckParts: object[],
 *   stockHealth: { usable: number, inactive: number },
 *   isReadyForProduction: boolean,
 *   generatedAt: string
 * } | null}
 */
const getProductionReadinessReport = (inputSummary = []) => {
  if (!Array.isArray(inputSummary)) return null;
  
  const summary          = markBottleneckParts(inputSummary);
  const maxProducibleUnits = calculateMaxManufacturableUnits(summary);
  const shortageParts    = identifyShortageParts(summary);
  const stockHealth      = calculateInactiveStockImpact(summary);
  const bottleneckParts  = summary.filter((p) => p.isBottleneck);
  
  return {
    summary,
    maxProducibleUnits,
    shortageParts,
    bottleneckParts,
    stockHealth,
    isReadyForProduction: shortageParts.length === 0,
    generatedAt: new Date().toISOString(),
  };
};

module.exports = {
  computeEstimatedBomCostSummary,
  identifyShortageParts,
  calculateMaterialUtilization,
  calculateInactiveStockImpact,
  calculateMaxManufacturableUnits,
  markBottleneckParts,
  getProductionReadinessReport,
};

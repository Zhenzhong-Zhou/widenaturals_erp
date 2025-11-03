/**
 * @fileoverview Core business logic for Bill of Materials (BOM) analysis and production readiness.
 *
 * Responsibilities:
 *  - Compute manufacturable quantities based on BOM definitions and warehouse inventory.
 *  - Identify shortages, inactive or unusable stock, and bottleneck components.
 *  - Aggregate results into a structured readiness or capacity report for manufacturing planning.
 *
 * Scope:
 *  - Layer: Business (pure domain logic, no database or side effects)
 *  - Dependencies: None (consumes transformed data from repository/transformer layers)
 *
 * Usage:
 *  - Typically invoked by service-layer functions such as getBOMProductionSummaryService().
 */

const { logSystemInfo } = require('../utils/system-logger');

/**
 * @function
 * @description
 * Compute the total estimated BOM cost in base currency (CAD by default),
 * normalizing each item using its exchange rate and quantity.
 *
 * - Performs only one rounding at the end for accuracy.
 * - Handles missing exchange rates gracefully (assumes 1.0).
 * - Returns summary metadata for BOM analysis.
 *
 * @param {Object} structuredResult - BOM details structure with cost fields
 * @param {string} [baseCurrency='CAD'] - Base currency for normalization
 * @returns {Object} Cost summary { type, description, totalEstimatedCost, currency, itemCount }
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
    const qty = Number(item.partQtyPerProduct ?? 1);
    const cost = Number(item.estimatedUnitCost ?? 0);
    const currency = item.currency ?? baseCurrency;
    const rate = Number(item.exchangeRate ?? 1);

    const amount = qty * cost;
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
 * Safely converts a value to a finite number, returning a fallback if conversion fails.
 *
 * @function
 * @param {*} v - Input value to convert.
 * @param {number} [fallback=0] - Fallback value if conversion fails or is not finite.
 * @returns {number} A finite number value.
 *
 * @example
 * toNumber('10'); // 10
 * toNumber('abc', 5); // 5
 */
const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Identifies BOM parts that are in shortage, meaning their available quantity
 * is less than the required quantity per product unit.
 *
 * @function
 * @param {Array<Object>} summary - Array of BOM part summary objects.
 * @returns {Array<Object>} Filtered list of parts where available quantity is insufficient.
 *
 * @example
 * const shortages = identifyShortageParts(summary);
 * console.table(shortages);
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
 * Calculates material utilization per BOM part for a given production target quantity.
 * Determines how much of each material will be consumed and what remains after production.
 *
 * @function
 * @param {Array<Object>} summary - Array of BOM summary objects.
 * @param {number} targetQty - Target quantity of finished units to be produced.
 * @returns {Array<Object>} Material utilization data per part, including sufficiency flags.
 *
 * @example
 * const utilization = calculateMaterialUtilization(summary, 100);
 * console.table(utilization);
 */
// todo: use in other service or api
const calculateMaterialUtilization = (summary = [], targetQty = 0) => {
  if (!Array.isArray(summary) || targetQty <= 0) return [];
  return summary.map((p) => {
    const required = Number(p.requiredQtyPerUnit) || 0;
    const available = Number(p.totalAvailableQuantity) || 0;
    const needed = targetQty * required;
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
 * Calculates total usable versus inactive stock quantities across all BOM parts.
 * This is useful for assessing the impact of inactive batches on total production readiness.
 *
 * @function
 * @param {Array<Object>} summary - BOM summary array (each part may include `materialBatches`).
 * @returns {{usable: number, inactive: number}} Object with total usable and inactive quantities.
 *
 * @example
 * const impact = calculateInactiveStockImpact(summary);
 * console.log(impact); // { usable: 480, inactive: 75 }
 */
const calculateInactiveStockImpact = (summary = []) => {
  const totals = { usable: 0, inactive: 0 };

  for (const part of summary) {
    const batches = Array.isArray(part.materialBatches)
      ? part.materialBatches
      : [];
    for (const batch of batches) {
      const qty = Number(batch.availableQuantity) || 0;
      if (batch.isInactiveBatch) totals.inactive += qty;
      else totals.usable += qty;
    }
  }

  return totals;
};

/**
 * Computes the maximum number of finished products that can be manufactured
 * given available material quantities, based on the most restrictive (bottleneck) part.
 *
 * @function
 * @param {Array<Object>} bomSummary - BOM summary array containing required and available quantities.
 * @returns {number} Maximum possible units that can be manufactured (bottleneck limit).
 *
 * @example
 * const maxUnits = calculateMaxManufacturableUnits(summary);
 * console.log(`Max producible units: ${maxUnits}`);
 */
const calculateMaxManufacturableUnits = (bomSummary = []) => {
  if (!Array.isArray(bomSummary) || bomSummary.length === 0) return 0;

  const limits = bomSummary.map((p) => {
    const available = toNumber(p.totalAvailableQuantity);
    const required = Math.max(toNumber(p.requiredQtyPerUnit), 0.0001); // prevent divide-by-zero
    return Math.floor(available / required);
  });

  const min = Math.min(...limits);
  return Number.isFinite(min) ? min : 0;
};

/**
 * Marks which BOM part(s) act as bottlenecks — i.e., the parts that limit
 * total production output due to the smallest `maxProducibleUnits` value.
 *
 * @function
 * @param {Array<Object>} summary - Array of transformed BOM part summaries.
 * @returns {Array<Object>} Same array with an added `isBottleneck` flag on limiting parts.
 *
 * @example
 * const marked = markBottleneckParts(summary);
 * console.table(marked.filter(p => p.isBottleneck));
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
 * Generate a complete production readiness report from a transformed BOM summary.
 *
 * @param {Array<Object>} inputSummary - Transformed BOM production summary (from transformer layer).
 *   Each item should contain:
 *     - partId {string}
 *     - partName {string}
 *     - requiredQtyPerUnit {number}
 *     - totalAvailableQuantity {number}
 *     - maxProducibleUnits {number}
 *     - isShortage {boolean}
 *     - materialBatches {Array<Object>} (optional)
 *
 * @returns {{
 *   summary: Array<Object>,
 *   maxProducibleUnits: number,
 *   shortageParts: Array<Object>,
 *   bottleneckParts: Array<Object>,
 *   stockHealth: { usable: number, inactive: number },
 *   isReadyForProduction: boolean,
 *   generatedAt: string
 * }} Production readiness report for the specified BOM.
 *
 * @example
 * const report = getProductionReadinessReport(summaryRows);
 * console.log(report.maxProducibleUnits); // 125
 * console.log(report.shortageParts); // []
 */
const getProductionReadinessReport = (inputSummary = []) => {
  if (!Array.isArray(inputSummary)) return null;

  // 1 Compute derived metrics
  const summary = markBottleneckParts(inputSummary);
  const maxProducibleUnits = calculateMaxManufacturableUnits(summary);
  const shortageParts = identifyShortageParts(summary);
  const stockHealth = calculateInactiveStockImpact(summary);
  const bottleneckParts = summary.filter((p) => p.isBottleneck);

  // 2 Build structured report
  const report = {
    summary,
    maxProducibleUnits,
    shortageParts: shortageParts ?? [],
    bottleneckParts: bottleneckParts ?? [],
    stockHealth,
    isReadyForProduction: shortageParts.length === 0,
    generatedAt: new Date().toISOString(),
  };

  // 3 Log contextual info for traceability
  logSystemInfo('Production readiness generated', {
    context: 'bom-business/getProductionReadinessReport',
    maxProducibleUnits,
    shortageCount: shortageParts.length,
    bottleneckCount: bottleneckParts.length,
  });

  return report;
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

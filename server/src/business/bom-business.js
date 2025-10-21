/**
 * Compute an estimated BOM cost summary.
 *
 * This represents design-time cost, based solely on BOM-level estimated_unit_cost.
 * Does not reflect supplier batch or procurement costs.
 *
 * @param {{ details: Array<{ quantityPerUnit?: number, estimatedUnitCost?: number, currency?: string }> }} structuredResult
 * @returns {{
 *   type: 'ESTIMATED',
 *   description: string,
 *   totalEstimatedCost: number,
 *   currency: string,
 *   itemCount: number
 * }}
 */
const computeEstimatedBomCostSummary = (structuredResult) => {
  if (!structuredResult?.details?.length) {
    return {
      type: 'ESTIMATED',
      description:
        'No BOM item details found. Estimated cost unavailable.',
      totalEstimatedCost: 0,
      currency: 'N/A',
      itemCount: 0,
    };
  }
  
  const totalEstimatedCost = structuredResult.details.reduce((sum, item) => {
    const qty = Number(item.quantityPerUnit || 0);
    const cost = Number(item.estimatedUnitCost || 0);
    return sum + qty * cost;
  }, 0);
  
  return {
    type: 'ESTIMATED',
    description:
      'Derived from BOM-level estimated_unit_cost. For planning and forecasting only — actual cost must be computed from supplier batches.',
    totalEstimatedCost,
    currency: structuredResult.details[0]?.currency || 'N/A',
    itemCount: structuredResult.details.length,
  };
};

// const computeBomCostVariance = (estimated, actual) => ({
//   variance: actual.totalActualCost - estimated.totalEstimatedCost,
//   variancePercent:
//     estimated.totalEstimatedCost > 0
//       ? ((actual.totalActualCost - estimated.totalEstimatedCost) /
//         estimated.totalEstimatedCost) *
//       100
//       : null,
// });

module.exports = {
  computeEstimatedBomCostSummary,
};

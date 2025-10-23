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
const computeEstimatedBomCostSummary = (structuredResult, baseCurrency = 'CAD') => {
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
    const qty = Number(item.quantityPerUnit ?? 1);
    const cost = Number(item.estimatedUnitCost ?? 0);
    const currency = item.currency ?? baseCurrency;
    const rate = Number(item.exchangeRate ?? 1);
    
    const amount = qty * cost;
    const converted =
      currency === baseCurrency ? amount : amount * rate;
    
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

module.exports = {
  computeEstimatedBomCostSummary,
};

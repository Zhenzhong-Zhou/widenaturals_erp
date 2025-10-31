/**
 * Formats a tax rate label for display in a dropdown.
 *
 * Combines the tax name, rate percentage, and optionally province or region into a user-friendly label.
 *
 * @param {{
 *   name: string,
 *   rate: number,
 *   province?: string,
 *   region?: string
 * }} row - Tax rate record containing label fields.
 * @returns {string} A formatted label like "GST (5%) - Canada" or "PST (7%) - BC".
 */
const formatTaxRateLabel = ({ name, rate, province, region }) => {
  const area = province || region;
  const areaSuffix = area ? ` - ${area}` : '';
  return `${name} (${rate}%)${areaSuffix}`;
};

module.exports = {
  formatTaxRateLabel,
};

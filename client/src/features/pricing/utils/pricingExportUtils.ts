import { PricingExportFilters } from '@features/pricing';

/**
 * Builds a human-readable filename suffix from active pricing export filters.
 *
 * Only includes string-readable fields (brand, countryCode).
 * UUID fields (pricingTypeId, productId, statusId) are intentionally
 * excluded as they are not meaningful in a filename context.
 *
 * @param filters - Active pricing export filters
 * @returns A filename suffix string (e.g. '_Canaherb_CA') or empty string if no readable filters are set
 *
 * @example
 * buildExportFileSuffix({ brand: 'Canaherb', countryCode: 'CA' })
 * // → '_Canaherb_CA'
 *
 * buildExportFileSuffix({})
 * // → ''
 */
export const buildExportFileSuffix = (filters: PricingExportFilters): string => {
  const parts: string[] = [];
  if (filters.brand)       parts.push(filters.brand);
  if (filters.countryCode) parts.push(filters.countryCode);
  return parts.length ? `_${parts.join('_')}` : '';
};

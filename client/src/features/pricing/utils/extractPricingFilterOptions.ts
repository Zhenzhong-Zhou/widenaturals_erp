import type { PricingRecord } from '@features/pricing/state';

interface PricingFilterOptions {
  brands: string[];
  countryCodes: string[];
  pricingTypes: string[];
  sizeLabels: string[];
}

/**
 * Extracts unique filter values from a list of pricing records.
 *
 * @param pricingData - Array of PricingRecord items
 * @returns An object with unique brand, countryCode, pricingType, and sizeLabel values
 */
export const extractPricingFilterOptions = (
  pricingData: PricingRecord[]
): PricingFilterOptions => {
  const brands = new Set<string>();
  const countryCodes = new Set<string>();
  const pricingTypes = new Set<string>();
  const sizeLabels = new Set<string>();

  for (const record of pricingData) {
    if (record.product?.brand) brands.add(record.product.brand);
    if (record.sku?.countryCode) countryCodes.add(record.sku.countryCode);
    if (record.pricingType?.name) pricingTypes.add(record.pricingType.name);
    if (record.sku?.sizeLabel) sizeLabels.add(record.sku.sizeLabel);
  }

  return {
    brands: Array.from(brands).sort(),
    countryCodes: Array.from(countryCodes).sort(),
    pricingTypes: Array.from(pricingTypes).sort(),
    sizeLabels: Array.from(sizeLabels).sort(),
  };
};

import type {
  PricingJoinRecord,
  FlattenedPricingJoinRecord,
} from '@features/pricing';

/**
 * Flattens pricing join list records into a table-friendly structure.
 *
 * Includes:
 *  - Pricing info (pricingId, pricingGroupId, price, validFrom, validTo)
 *  - Pricing type info (pricingTypeId, pricingTypeName, pricingTypeCode)
 *  - Geography (countryCode)
 *  - SKU info (skuId, sku, barcode, sizeLabel, skuCountryCode)
 *  - Product info (productId, productName, brand, category, displayName)
 *  - Status info (statusName, statusDate)
 *
 * @param records - Array of PricingJoinRecord returned from the API
 * @returns Flat array of FlattenedPricingJoinRecord
 */
export const flattenPricingJoinRecords = (
  records: PricingJoinRecord[]
): FlattenedPricingJoinRecord[] => {
  if (!Array.isArray(records)) return [];
  
  return records.map((record) => {
    const status = record.status ?? { name: '—', date: null };
    
    return {
      // ------------------------------
      // Pricing
      // ------------------------------
      pricingId:      record.pricingId      ?? null,
      pricingGroupId: record.pricingGroupId ?? null,
      price:          record.price          ?? 0,
      validFrom:      record.validFrom      ?? '',
      validTo:        record.validTo        ?? null,
      
      // ------------------------------
      // Pricing Type
      // ------------------------------
      pricingTypeId:   record.pricingTypeId   ?? null,
      pricingTypeName: record.pricingTypeName ?? '—',
      pricingTypeCode: record.pricingTypeCode ?? '—',
      
      // ------------------------------
      // Geography
      // ------------------------------
      countryCode: record.countryCode ?? '—',
      
      // ------------------------------
      // SKU
      // ------------------------------
      skuId:          record.skuId          ?? null,
      sku:            record.sku            ?? '—',
      barcode:        record.barcode        ?? '—',
      sizeLabel:      record.sizeLabel      ?? '—',
      skuCountryCode: record.skuCountryCode ?? '—',
      
      // ------------------------------
      // Product
      // ------------------------------
      productId:   record.productId   ?? null,
      productName: record.productName ?? '—',
      brand:       record.brand       ?? '—',
      category:    record.category    ?? '—',
      displayName: record.displayName ?? '—',
      
      // ------------------------------
      // Status
      // ------------------------------
      statusName: status.name ?? '—',
      statusDate: status.date ?? null,
    };
  });
};

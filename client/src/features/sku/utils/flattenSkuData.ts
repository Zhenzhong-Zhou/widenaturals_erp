import type {
  FlattenedSkuRecord,
  SkuListItem,
  SkuListProduct,
  SkuStatusRecord,
} from '@features/sku/state';
import type { GenericAudit } from '@shared-types/api';

/**
 * Flattens SKU list items into a table-friendly structure.
 *
 * Includes:
 *  - Product info (name, brand, series, category)
 *  - SKU info (code, barcode, region, size, language)
 *  - Status info (status name + date)
 *  - Audit info (createdBy, createdAt, updatedBy, updatedAt)
 *  - Primary SKU image URL (first image using priority rules)
 *
 * @param records - Array of SkuListItem returned from the paginated SKUs API
 * @returns Flat array of FlattenedSkuRecord
 */
export const flattenSkuRecords = (
  records: SkuListItem[]
): FlattenedSkuRecord[] => {
  if (!Array.isArray(records)) return [];
  
  return records.map((record) => {
    const product: SkuListProduct = record.product ?? ({} as SkuListProduct);
    const status: SkuStatusRecord = record.status ?? ({} as SkuStatusRecord);
    const audit: GenericAudit = record.audit ?? ({} as GenericAudit);
    
    return {
      // ------------------------------
      // Product Info
      // ------------------------------
      productId: product.id ?? null,
      productName: product.name ?? '—',
      brand: product.brand ?? '—',
      series: product.series ?? '—',
      category: product.category ?? '—',
      displayProductName: product.displayName ?? '—',
      
      // ------------------------------
      // SKU Info
      // ------------------------------
      skuId: record.id ?? null,
      skuCode: record.sku ?? '—',
      barcode: record.barcode ?? '—',
      language: record.language ?? '—',
      countryCode: record.countryCode ?? '—',
      marketRegion: record.marketRegion ?? '—',
      sizeLabel: record.sizeLabel ?? '—',
      displayLabel: record.displayLabel ?? '—',
      
      /**
       * Primary image for this SKU.
       * Null if no image exists.
       */
      primaryImageUrl: record.primaryImageUrl ?? null,
      
      // ------------------------------
      // Status Info
      // ------------------------------
      statusName: status.name ?? '—',
      statusDate: status.date ?? '',
      
      // ------------------------------
      // Audit Info
      // ------------------------------
      createdAt: audit.createdAt ?? '',
      createdBy: audit.createdBy?.name ?? '—',
      updatedAt: audit.updatedAt ?? '',
      updatedBy: audit.updatedBy?.name ?? '—',
    };
  });
};

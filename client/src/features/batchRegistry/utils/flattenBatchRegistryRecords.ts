import type {
  BatchRegistryRecord,
  FlattenedBatchRegistryRecord,
} from '@features/batchRegistry/state';

/**
 * flattenBatchRegistryRecords
 *
 * Transforms domain-level batch registry records into a **flattened,
 * presentation-friendly structure** suitable for:
 *
 * - table and list rendering
 * - client-side sorting and filtering
 * - CSV / Excel export
 * - Redux paginated state
 *
 * This function intentionally **denormalizes** data from multiple domains
 * (registry, status, product/SKU, packaging material, manufacturer/supplier)
 * into a single, shallow record shape.
 *
 * Supported batch types:
 * - product batches
 * - packaging material batches
 *
 * Behavior notes:
 * - Fields not applicable to a given `batchType` are populated with
 *   safe placeholder values (e.g. '—', '-') to simplify UI rendering.
 * - This transformation is **lossy by design** and should not be used
 *   for write operations or domain logic.
 *
 * Input:
 * - `BatchRegistryRecord[]` (normalized, domain-level records)
 *
 * Output:
 * - `FlattenedBatchRegistryRecord[]` (UI-optimized records)
 */
export const flattenBatchRegistryRecords = (
  records: BatchRegistryRecord[]
): FlattenedBatchRegistryRecord[] => {
  if (!Array.isArray(records)) return [];
  
  return records.map((record) => {
    const status = record.status ?? {};
    const registeredBy = record.registeredBy ?? {};
    
    // Base flattened structure with UI-safe defaults.
    // Values will be selectively overridden per batch type.
    const base = {
      // --- Core ---
      id: record.id,
      batchType: record.type,
      lotNumber: record.lotNumber ?? '—',
      expiryDate: record.expiryDate ?? null,
      
      // --- Status ---
      status: status.name ?? '—',
      statusDate: status.date ?? '',
      
      // --- Registry audit ---
      registeredAt: record.registeredAt ?? '',
      registeredBy: registeredBy.name ?? '—',
      
      note: record.note ?? '-',
      
      // --- Product-side defaults ---
      productId: null,
      productName: '—',
      skuCode: '—',
      manufacturerName: '—',
      
      // --- Packaging-side defaults ---
      packagingBatchId: null,
      packagingDisplayName: '-',
      packagingMaterialCode: '—',
      supplierName: '—',
    };
    
    if (record.type === 'product') {
      return {
        ...base,
        productId: record.product?.id ?? null,
        productName: record.product?.name ?? '—',
        skuCode: record.sku?.code ?? '—',
        manufacturerName: record.manufacturer?.name ?? '—',
      };
    }
    
    // packaging_material
    return {
      ...base,
      packagingBatchId: record.packagingBatchId ?? null,
      packagingDisplayName: record.packagingDisplayName ?? '-',
      packagingMaterialCode:
        record.packagingMaterial?.code ?? '—',
      supplierName:
        record.supplier?.name ?? '—',
    };
  });
};

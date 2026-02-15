import type {
  ProductBatchRecord,
  FlattenedProductBatchRecord,
} from '@features/productBatch/state';

/**
 * flattenProductBatchRecords
 *
 * Transforms domain-level product batch records into a **flattened,
 * presentation-friendly structure** suitable for:
 *
 * - table and list rendering
 * - client-side sorting and filtering
 * - CSV / Excel export
 * - Redux paginated state
 *
 * This function intentionally **denormalizes** data from multiple domains
 * (batch, SKU, product, manufacturer, status, audit) into a single,
 * shallow record shape optimized for UI consumption.
 *
 * Behavior notes:
 * - Missing or optional fields are populated with UI-safe defaults
 *   (e.g. '—', null) to simplify rendering logic.
 * - This transformation is **lossy by design** and must not be used
 *   for write operations or domain-level business logic.
 *
 * Input:
 * - `ProductBatchRecord[]` (normalized, domain-level records)
 *
 * Output:
 * - `FlattenedProductBatchRecord[]` (UI-optimized records)
 */
export const flattenProductBatchRecords = (
  records: ProductBatchRecord[]
): FlattenedProductBatchRecord[] => {
  if (!Array.isArray(records)) return [];

  return records.map((record) => {
    const status = record.status ?? {};
    const audit = record.audit ?? {};

    return {
      // --- Core ---
      id: record.id,
      lotNumber: record.lotNumber ?? '—',

      // --- SKU ---
      skuId: record.sku?.id ?? null,
      skuCode: record.sku?.code ?? '—',
      sizeLabel: record.sku?.sizeLabel ?? '—',

      // --- Product ---
      productId: record.product?.id ?? null,
      productName: record.product?.name ?? '—',
      productBrand: record.product?.brand ?? '—',
      productCategory: record.product?.category ?? '—',
      productDisplayName: record.product?.displayName ?? '—',

      // --- Manufacturer ---
      manufacturerId: record.manufacturer?.id ?? null,
      manufacturerName: record.manufacturer?.name ?? '—',

      // --- Lifecycle ---
      manufactureDate: record.lifecycle?.manufactureDate ?? null,
      expiryDate: record.lifecycle?.expiryDate ?? null,
      receivedDate: record.lifecycle?.receivedDate ?? null,
      initialQuantity: record.lifecycle?.initialQuantity ?? 0,

      // --- Status ---
      statusId: status.id ?? null,
      statusName: status.name ?? '—',
      statusDate: status.date ?? '',

      // --- Release ---
      releasedAt: record.releasedAt ?? null,
      releasedByName: record.releasedBy?.name ?? '—',

      // --- Audit ---
      createdAt: audit.createdAt ?? '',
      createdByName: audit.createdBy?.name ?? '—',
      updatedAt: audit.updatedAt ?? null,
      updatedByName: audit.updatedBy?.name ?? '—',
    };
  });
};

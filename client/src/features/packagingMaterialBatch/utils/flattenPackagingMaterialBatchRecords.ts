import type {
  PackagingMaterialBatch,
  FlattenedPackagingMaterialBatchRow,
} from '@features/packagingMaterialBatch/state';

/**
 * flattenPackagingMaterialBatchRecords
 *
 * Transforms domain-level packaging material batch records into a
 * flattened, presentation-optimized structure suitable for:
 *
 * - table and list rendering
 * - client-side sorting and filtering
 * - CSV / Excel export
 * - Redux paginated state
 *
 * This function intentionally denormalizes nested domain objects
 * (material snapshot, supplier, lifecycle, cost, status, audit)
 * into a shallow row structure optimized for UI consumption.
 *
 * Behavior notes:
 * - Missing or optional values are replaced with UI-safe defaults
 *   ('—' for display fields, null for nullable fields).
 * - This transformation is lossy by design.
 * - Must not be used for write operations or business logic.
 *
 * Input:
 * - `PackagingMaterialBatch[]` (domain-level records)
 *
 * Output:
 * - `FlattenedPackagingMaterialBatchRow[]` (UI-optimized rows)
 */
export const flattenPackagingMaterialBatchRecords = (
  records: PackagingMaterialBatch[]
): FlattenedPackagingMaterialBatchRow[] => {
  if (!Array.isArray(records)) return [];
  
  return records.map((record) => {
    const lifecycle = record.lifecycle ?? {};
    const status = record.status ?? {};
    const audit = record.audit ?? {};
    const material = record.material ?? {};
    const packagingMaterial = record.packagingMaterial ?? {};
    const supplier = record.supplier ?? {};
    const cost = record.cost ?? {};
    const quantity = record.quantity ?? {};
    
    return {
      // --- Core ---
      id: record.id,
      lotNumber: record.lotNumber ?? '—',
      
      // --- Material Snapshot ---
      materialInternalName: material.internalName ?? '—',
      supplierLabel: material.supplierLabel ?? '—',
      
      // --- Quantity ---
      quantityValue: quantity.value ?? '0',
      quantityUnit: quantity.unit ?? '—',
      
      // --- Lifecycle ---
      manufactureDate: lifecycle.manufactureDate ?? null,
      expiryDate: lifecycle.expiryDate ?? null,
      receivedAt: lifecycle.receivedAt ?? '',
      receivedById: lifecycle.receivedBy?.id ?? null,
      receivedByName: lifecycle.receivedBy?.name ?? '—',
      
      // --- Cost ---
      unitCost: cost.unitCost ?? '0',
      currency: cost.currency ?? '—',
      exchangeRate: cost.exchangeRate ?? '1',
      totalCost: cost.totalCost ?? '0',
      
      // --- Status ---
      statusId: status.id ?? null,
      statusName: status.name ?? '—',
      statusDate: status.date ?? '',
      
      // --- Packaging Material ---
      packagingMaterialId: packagingMaterial.id ?? null,
      packagingMaterialCode: packagingMaterial.code ?? '—',
      packagingMaterialCategory: packagingMaterial.category ?? '—',
      
      // --- Supplier ---
      supplierId: supplier.id ?? null,
      supplierName: supplier.name ?? '—',
      isPreferredSupplier: supplier.isPreferred ?? false,
      supplierLeadTimeDays: supplier.leadTimeDays ?? 0,
      
      // --- Audit ---
      createdAt: audit.createdAt ?? '',
      createdById: audit.createdBy?.id ?? null,
      createdByName: audit.createdBy?.name ?? '—',
      updatedAt: audit.updatedAt ?? null,
      updatedById: audit.updatedBy?.id ?? null,
      updatedByName: audit.updatedBy?.name ?? '—',
    };
  });
};

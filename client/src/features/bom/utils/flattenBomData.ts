import type {
  BomListItem,
  BomRow,
  ComplianceInfo,
  FlattenedBomRecord,
  ProductSummary,
  SkuSummary,
} from '@features/bom/state';
import { GenericAudit, GenericStatus } from '@shared-types/api';

/**
 * Flattens BOM list records into a canonical, UI-ready shape.
 *
 * The resulting records combine product, SKU, BOM, status,
 * compliance, and audit metadata into a single flat structure.
 *
 * This transformation is intended to be applied once at the
 * thunk/ingestion boundary before data enters Redux state.
 */
export const flattenBomRecords = (
  records: BomListItem[]
): FlattenedBomRecord[] => {
  if (!Array.isArray(records)) return [];

  return records.map((record) => {
    const product = record.product ?? ({} as ProductSummary);
    const sku = record.sku ?? ({} as SkuSummary);
    const bom = record.bom ?? ({} as BomRow);

    const audit = bom.audit ?? ({} as GenericAudit);
    const status = bom.status ?? ({} as GenericStatus);
    const compliance = sku.compliance ?? ({} as ComplianceInfo);

    return {
      // --- Product Info ---
      productId: product.id ?? null,
      productName: product.name ?? '—',
      brand: product.brand ?? '—',
      series: product.series ?? '—',
      category: product.category ?? '—',

      // --- SKU Info ---
      skuId: sku.id ?? null,
      skuCode: sku.code ?? '—',
      barcode: sku.barcode ?? '—',
      marketRegion: sku.marketRegion ?? '—',
      countryCode: sku.countryCode ?? '—',
      language: sku.language ?? '—',
      sizeLabel: sku.sizeLabel ?? '—',
      skuDescription: sku.description ?? '—',

      // --- BOM Info ---
      bomId: bom.id ?? null,
      bomCode: bom.code ?? '—',
      bomName: bom.name ?? '—',
      bomDescription: bom.description ?? '—',
      revision: bom.revision ?? null,
      isActive: bom.isActive ?? false,
      isDefault: bom.isDefault ?? false,

      // --- Status Info ---
      status: status.name ?? '—',
      statusDate: status.date ?? '',

      // --- Compliance Info ---
      npnNumber: compliance.number ?? '—',
      complianceType: compliance.type ?? '—',
      complianceIssuedDate: compliance.issuedDate ?? null,
      complianceExpiryDate: compliance.expiryDate ?? null,

      // --- Audit Info ---
      createdAt: audit.createdAt ?? '',
      createdBy: audit.createdBy?.name ?? '—',
      updatedAt: audit.updatedAt ?? '',
      updatedBy: audit.updatedBy?.name ?? '—',
    };
  });
};

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
 * Flattens an array of nested BOM records into a flat structure
 * suitable for table display, export, or lightweight data handling.
 *
 * Includes:
 *  - Product info (name, brand, series, category)
 *  - SKU info (code, barcode, region, language, sizeLabel)
 *  - BOM info (code, name, revision, description, active flags)
 *  - Status info (status name + date)
 *  - Compliance info (type, number, issuedDate)
 *  - Audit info (createdBy, createdAt, updatedBy, updatedAt)
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

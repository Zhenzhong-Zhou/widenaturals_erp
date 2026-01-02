import {
  ComplianceRecord,
  ComplianceRecordTableRow,
} from '@features/complianceRecord/state';

/**
 * Flattens a ComplianceRecord into a table-friendly row.
 *
 * @param record - Raw compliance record from API
 * @returns Flattened table row
 */
export const flattenComplianceRecordToRow = (
  record: ComplianceRecord
): ComplianceRecordTableRow => {
  const { id, type, documentNumber, issuedDate, status, sku, product, audit } =
    record;

  return {
    // Identity
    id,

    // Compliance
    type,
    documentNumber,
    issuedDate,

    // Status
    statusId: status.id,
    statusName: status.name,
    statusDate: status.date,

    // SKU
    skuId: sku.id,
    skuCode: sku.sku,
    sizeLabel: sku.sizeLabel,
    marketRegion: sku.marketRegion,

    // Product
    productId: product.id,
    productName: product.name,
    brand: product.brand,
    series: product.series,
    category: product.category,
    productDisplayName: product.displayName,

    // Audit
    createdAt: audit.createdAt ?? null,
    createdById: audit.createdBy?.id ?? null,
    createdByName: audit.createdBy?.name ?? '—',
    updatedAt: audit.updatedAt ?? null,
    updatedById: audit.updatedBy?.id ?? null,
    updatedByName: audit.updatedBy?.name ?? '—',
  };
};

/**
 * Flattens an array of ComplianceRecords into table rows.
 *
 * @param records - Compliance records array
 * @returns Flattened table rows
 */
export const flattenComplianceRecordsToRows = (
  records: ComplianceRecord[]
): ComplianceRecordTableRow[] => {
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  return records.map(flattenComplianceRecordToRow);
};

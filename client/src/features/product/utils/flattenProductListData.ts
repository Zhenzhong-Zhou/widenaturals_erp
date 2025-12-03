import type {
  FlattenedProductRecord,
  ProductListItem,
} from '@features/product/state';
import type { GenericAudit } from '@shared-types/api';

/**
 * Flattens Product list items into a table-friendly structure.
 *
 * Includes:
 *  - Core product info (name, brand, series, category)
 *  - Status info (status name + date)
 *  - Audit info (createdBy, createdAt, updatedBy, updatedAt)
 *
 * @param records - Array of ProductListItem returned from the API
 * @returns Flat array of FlattenedProductRecord
 */
export const flattenProductRecords = (
  records: ProductListItem[]
): FlattenedProductRecord[] => {
  if (!Array.isArray(records)) return [];

  return records.map((record) => {
    const status = record.status ?? { name: '—', date: '' };
    const audit: GenericAudit = record.audit ?? ({} as GenericAudit);

    return {
      // ------------------------------
      // Product Info
      // ------------------------------
      productId: record.id ?? null,
      name: record.name ?? '—',
      brand: record.brand ?? '—',
      series: record.series ?? '—',
      category: record.category ?? '—',

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

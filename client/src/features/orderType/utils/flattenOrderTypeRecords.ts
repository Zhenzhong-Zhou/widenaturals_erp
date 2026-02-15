import type {
  FlattenedOrderTypeRecord,
  OrderTypeListItem,
} from '@features/orderType/state';

/**
 * flattenOrderTypeRecords
 *
 * Transforms domain-level order type records into a flattened,
 * presentation-friendly structure suitable for:
 *
 * - table and list rendering
 * - client-side sorting and filtering
 * - dropdowns and lookups
 * - Redux paginated state
 *
 * This transformer normalizes status and audit metadata into
 * reusable generic interfaces.
 *
 * Input:
 * - `OrderTypeListItem[]` (domain-level records)
 *
 * Output:
 * - `FlattenedOrderTypeRecord[]` (UI-optimized records)
 */
export const flattenOrderTypeRecords = (
  records: OrderTypeListItem[]
): FlattenedOrderTypeRecord[] => {
  if (!Array.isArray(records)) return [];

  return records.map((record) => ({
    // ─────────────────────────────
    // Core
    // ─────────────────────────────
    id: record.id,
    name: record.name ?? '—',
    code: record.code ?? '—',
    category: record.category ?? '—',
    requiresPayment: Boolean(record.requiresPayment),

    // ─────────────────────────────
    // Status (flattened)
    // ─────────────────────────────
    statusId: record.status?.id ?? null,
    statusName: record.status?.name ?? '—',
    statusDate: record.status?.date ?? null,

    // ─────────────────────────────
    // Audit (flattened)
    // ─────────────────────────────
    createdAt: record.audit?.createdAt ?? null,
    createdBy: record.audit?.createdBy ? record.audit.createdBy.name : null,
    updatedAt: record.audit?.updatedAt ?? null,
    updatedBy: record.audit?.updatedBy ? record.audit.updatedBy.name : null,
  }));
};

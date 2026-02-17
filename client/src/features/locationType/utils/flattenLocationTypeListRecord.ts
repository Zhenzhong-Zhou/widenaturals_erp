import type {
  LocationTypeRecord,
  FlattenedLocationTypeRecord,
} from '@features/locationType';

/**
 * Transforms canonical LocationTypeRecord objects into
 * flattened UI-ready structures.
 *
 * Responsibilities:
 * - Flattens nested status metadata
 * - Flattens audit metadata
 * - Ensures nullable safety for optional fields
 * - Produces table-ready records
 *
 * This transformation is intentionally shallow and
 * UI-oriented only.
 */
export const flattenLocationTypeListRecord = (
  records: LocationTypeRecord[]
): FlattenedLocationTypeRecord[] =>
  records.map((locationType) => ({
    // --------------------------------------------------
    // Core identity
    // --------------------------------------------------
    id: locationType.id,
    code: locationType.code,
    name: locationType.name,
    description: locationType.description ?? null,
    
    // --------------------------------------------------
    // Status
    // --------------------------------------------------
    statusId: locationType.status.id,
    statusName: locationType.status.name,
    statusDate: locationType.status.date,
    
    // --------------------------------------------------
    // Audit
    // --------------------------------------------------
    createdAt: locationType.audit.createdAt,
    createdById: locationType.audit.createdBy?.id ?? null,
    createdByName: locationType.audit.createdBy?.name ?? '—',
    
    updatedAt: locationType.audit.updatedAt ?? null,
    updatedById: locationType.audit.updatedBy?.id ?? null,
    updatedByName: locationType.audit.updatedBy?.name ?? null,
  }));

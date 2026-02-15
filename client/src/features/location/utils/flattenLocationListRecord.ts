import type {
  LocationRecord,
  FlattenedLocationListRecord,
} from '@features/location';

/**
 * Transforms canonical LocationRecord objects into
 * flattened UI-ready structures.
 */
export const flattenLocationListRecord = (
  records: LocationRecord[]
): FlattenedLocationListRecord[] =>
  records.map((location) => ({
    id: location.id,
    name: location.name,
    locationType: location.locationType,

    city: location.address?.city ?? null,
    provinceOrState: location.address?.provinceOrState ?? null,
    country: location.address?.country ?? null,

    isArchived: location.isArchived,

    statusName: location.status.name,
    statusDate: location.status.date,

    createdAt: location.audit.createdAt,
    updatedAt: location.audit.updatedAt ?? null,

    createdByName: location.audit.createdBy?.name ?? '—',
    updatedByName: location.audit.updatedBy?.name ?? null,
  }));

import type {
  FlattenedLocationTypeDetails,
  LocationTypeDetails,
} from '@features/locationType';

/**
 * Transforms a canonical LocationTypeDetails object into
 * a flattened UI-ready structure.
 *
 * Responsibilities:
 * - Flattens nested status metadata
 * - Flattens audit metadata
 * - Ensures nullable safety for optional fields
 * - Produces detail-view-ready record
 *
 * This transformation is intentionally shallow and
 * UI-oriented only.
 */
export const flattenLocationTypeDetails = (
  details: LocationTypeDetails
): FlattenedLocationTypeDetails => ({
  // --------------------------------------------------
  // Core identity
  // --------------------------------------------------
  id: details.id,
  code: details.code,
  name: details.name,
  description: details.description ?? null,

  // --------------------------------------------------
  // Status
  // --------------------------------------------------
  statusId: details.status?.id ?? '',
  statusName: details.status?.name ?? '—',
  statusDate: details.status?.date ?? '',

  // --------------------------------------------------
  // Audit
  // --------------------------------------------------
  createdAt: details.audit?.createdAt ?? '',
  createdById: details.audit?.createdBy?.id ?? null,
  createdByName: details.audit?.createdBy?.name ?? '—',

  updatedAt: details.audit?.updatedAt ?? null,
  updatedById: details.audit?.updatedBy?.id ?? null,
  updatedByName: details.audit?.updatedBy?.name ?? null,
});

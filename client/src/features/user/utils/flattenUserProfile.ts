import { FlattenedUserProfile, UserProfile } from '@features/user';
import { formatImageUrl } from '@utils/formatImageUrl';

/**
 * Flattens a `UserProfile` domain model into a UI-friendly structure.
 *
 * Purpose:
 * - Removes nested structures for easier rendering
 * - Normalizes optional fields to `null`
 * - Produces a stable, presentation-only shape
 *
 * Notes:
 * - UI-facing only (no business or authorization logic)
 * - Safe to call with `null`
 */
export const flattenUserProfile = (
  profile: UserProfile | null
): FlattenedUserProfile | null => {
  if (!profile) return null;

  return {
    // ----------------------------
    // Core identity
    // ----------------------------
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    jobTitle: profile.jobTitle,
    isSystem: profile.isSystem,

    // ----------------------------
    // Avatar
    // ----------------------------
    avatarUrl: profile.avatar?.url ? formatImageUrl(profile.avatar.url) : null,
    avatarFormat: profile.avatar?.format ?? null,
    avatarUploadedAt: profile.avatar?.uploadedAt ?? null,

    // ----------------------------
    // Role & permissions
    // ----------------------------
    roleId: profile.role?.id ?? null,
    roleName: profile.role?.name ?? null,
    roleGroup: profile.role?.roleGroup ?? null,
    hierarchyLevel: profile.role?.hierarchyLevel ?? null,
    permissions: profile.role?.permissions?.map((p) => p.name) ?? [],

    // ----------------------------
    // Status
    // ----------------------------
    statusId: profile.status?.id ?? null,
    statusName: profile.status?.name ?? null,
    statusDate: profile.status?.date ?? null,

    // ----------------------------
    // Audit
    // ----------------------------
    createdAt: profile.audit?.createdAt ?? null,
    createdById: profile.audit?.createdBy?.id ?? null,
    createdByName: profile.audit?.createdBy?.name ?? null,
    updatedAt: profile.audit?.updatedAt ?? null,
    updatedById: profile.audit?.updatedBy?.id ?? null,
    updatedByName: profile.audit?.updatedBy?.name ?? null,
  };
};

import { NullableNumber, NullableString } from '@shared-types/shared';
import {
  ApiSuccessResponse,
  AsyncState,
  DateRange,
  GenericAudit,
  GenericAvatar,
  GenericStatus,
  ImageFileFormat,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import { ReduxPaginatedState } from '@shared-types/pagination';

/**
 * Base user view shared by all UI representations.
 *
 * Contains identity and common display fields that are safe to
 * expose across card, list, and detail views.
 */
export interface UserBaseView {
  /** Unique user identifier */
  id: string;

  /** Derived display name (firstname + lastname) */
  fullName: string;

  /** Contact email (maybe omitted in lightweight responses) */
  email?: string;

  /** Contact phone number (optional / may be omitted) */
  phoneNumber?: string;

  /** Job title or position */
  jobTitle?: string;

  /** Role identifier (UUID) */
  roleId?: string;

  /** Human-readable role name */
  roleName?: string;

  /** Avatar image URL (nullable if not set) */
  avatarUrl?: NullableString;
}

/**
 * Lightweight user representation for card-based layouts.
 *
 * Optimized for fast list rendering and minimal payload size.
 * Intended for grid / gallery views where audit metadata
 * is not required.
 */
export interface UserCardView extends UserBaseView {
  /** Human-readable status name */
  statusName?: string;
}

/**
 * Full user representation for table and detail views.
 *
 * Includes identity, role, status metadata, and audit fields
 * required for administrative and operational workflows.
 */
export interface UserListView extends UserBaseView {
  /** Current status metadata */
  status?: GenericStatus;

  /** Audit trail (created / updated info) */
  audit?: GenericAudit;
}

/**
 * Determines which user view model is returned by the API.
 *
 * This value is considered UI intent and is NOT persisted
 * in Redux state.
 */
export type UserViewMode = 'card' | 'list';

/**
 * Paginated response for card-based user lists.
 */
export type PaginatedUserCardListResponse = PaginatedResponse<UserCardView>;

/**
 * Paginated response for full user lists.
 */
export type PaginatedUserListResponse = PaginatedResponse<UserListView>;

/**
 * Date range filter using ISO strings for API safety.
 */
export interface UserDateRanges {
  /** Filter by creation timestamp */
  created?: DateRange;

  /** Filter by last update timestamp */
  updated?: DateRange;
}

/**
 * Supported filters for user list retrieval.
 */
export interface UserFilters {
  // ----------------------------
  // User-level filters
  // ----------------------------
  statusIds?: string | string[];
  roleIds?: string | string[];

  firstname?: string;
  lastname?: string;
  email?: string;
  phoneNumber?: string;
  jobTitle?: string;

  // ----------------------------
  // Audit filters
  // ----------------------------
  createdBy?: string;
  updatedBy?: string;

  // ----------------------------
  // Keyword search
  // ----------------------------
  keyword?: string;

  /** Grouped date range filters */
  dateRanges?: UserDateRanges;
}

/**
 * Allowed fields for user list sorting.
 *
 * These values map directly to SQL-safe expressions
 * in the repository layer.
 */
export type UserSortField =
  | 'fullName'
  | 'firstname'
  | 'lastname'
  | 'email'
  | 'roleName'
  | 'statusName'
  | 'jobTitle'
  | 'phoneNumber'
  | 'createdAt'
  | 'updatedAt'
  | 'defaultNaturalSort';

/**
 * Parameters for retrieving a paginated list of users.
 */
export interface GetPaginatedUsersParams extends PaginationParams, SortConfig {
  /** Optional filtering configuration */
  filters?: UserFilters;
}

/**
 * Redux state slice for paginated users.
 *
 * Stores raw API user records in either card-view or list-view
 * shape, depending on the query.
 *
 * Design notes:
 * - This state intentionally stores domain data only
 * - UI-only concerns (view mode, layout, selection)
 *   are handled at the component or selector level
 * - Prevents reducer conflicts and keeps state reusable
 *
 * Usage:
 * - Card view → data contains `UserCardView[]`
 * - List view → data contains `UserListView[]`
 *
 * Pagination metadata is preserved regardless of view.
 */
export type PaginatedUsersState = ReduxPaginatedState<
  UserCardView | UserListView
>;

/**
 * Flattened user record for table rendering, CSV export,
 * and other dense, row-based UI or reporting use cases.
 *
 * Derived from `UserCardView | UserListView` via a transformer.
 * Not returned directly by the API.
 */
export interface FlattenedUserRecord {
  // ----------------------------
  // Identity
  // ----------------------------
  userId: NullableString;
  fullName: string;
  email: string;
  jobTitle: string;
  phoneNumber: string;

  // ----------------------------
  // Role
  // ----------------------------
  roleName: string;

  // ----------------------------
  // Avatar
  // ----------------------------
  avatarUrl: NullableString;

  // ----------------------------
  // Status
  // ----------------------------
  statusName: string;
  statusDate: string;

  // ----------------------------
  // Audit
  // ----------------------------
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Standard successful API response wrapper for user profile retrieval.
 *
 * - `data` contains the resolved user profile payload.
 * - `userId` is echoed for traceability and log correlation.
 *
 * NOTE:
 * `userId` may differ from `data.id` in edge cases such as
 * delegated access, impersonation, or future system-level views.
 */
export interface UserProfileResponse extends ApiSuccessResponse<UserProfile> {
  /**
   * The unique identifier of the user whose profile was requested.
   *
   * Included explicitly to simplify logging, caching, and request correlation,
   * independent of the resolved payload structure.
   */
  userId: string;
}

/**
 * Canonical user profile model returned by the User Profile API.
 *
 * This model represents a **read-only, presentation-safe** view of a user.
 * It must never be treated as an authorization or identity source on the client.
 *
 * All access control, permission enforcement, and trust decisions
 * remain strictly server-side.
 */
export interface UserProfile {
  /**
   * Unique user identifier (UUID).
   */
  id: string;

  /**
   * User email address.
   *
   * Guaranteed to be unique within the system at all times.
   */
  email: string;

  /**
   * Human-readable full name.
   *
   * Typically composed of first and last name, but may vary
   * depending on system configuration or locale.
   */
  fullName: string;

  /**
   * Optional job title or role description.
   *
   * May be null for system-seeded, service, or automation users.
   */
  jobTitle: NullableString;

  /**
   * User avatar information.
   *
   * Null if the user has not uploaded an avatar.
   * Presentation-only field with no security implications.
   */
  avatar: GenericAvatar | null;

  /**
   * Indicates whether the user is a system-level account.
   *
   * System users may receive special handling or restrictions
   * enforced exclusively by backend business logic.
   */
  isSystem: boolean;

  /**
   * Current lifecycle status of the user.
   *
   * Includes status identifier, human-readable name,
   * and the effective date of the status.
   */
  status: GenericStatus;

  /**
   * Role assignment and associated permissions.
   *
   * This is a **presentation-level** role model intended for
   * UI behavior (feature visibility, labeling, hints).
   *
   * It must not be treated as an authorization source.
   */
  role: UserRole;

  /**
   * Audit metadata related to user creation and modification.
   *
   * Informational only. Must not be used for access control,
   * trust decisions, or client-side security logic.
   */
  audit: GenericAudit;
}

/**
 * Role assigned to a user.
 *
 * A role aggregates a dynamic set of permissions.
 * The client must treat this model as descriptive rather than authoritative.
 */
export interface UserRole {
  /**
   * Unique role identifier.
   */
  id: string;

  /**
   * Role name (e.g. "root_admin", "inventory_manager").
   */
  name: string;

  /**
   * Optional role grouping or classification.
   *
   * May be null if the role does not belong to a defined group.
   */
  roleGroup: NullableString;

  /**
   * Optional hierarchy level used for ordering or comparison.
   *
   * Informational only. No ordering or precedence guarantees
   * should be inferred on the client.
   */
  hierarchyLevel: NullableNumber;

  /**
   * List of permissions granted to this role.
   *
   * Permissions are modeled as opaque identifiers to allow
   * backend-driven evolution without breaking clients.
   *
   * Ordering is not guaranteed and must not be relied upon.
   */
  permissions: RolePermission[];
}

/**
 * Individual permission descriptor.
 *
 * The client must not assume:
 * - the full universe of permissions is known
 * - permission keys are stable across deployments
 *
 * Permission checks on the client are strictly for UX purposes.
 * All authorization enforcement must occur server-side.
 */
export interface RolePermission {
  /**
   * Unique permission identifier.
   */
  id: string;

  /**
   * Machine-readable permission key.
   *
   * Treated as an opaque string on the client to ensure
   * forward compatibility and backend-driven changes.
   */
  key: string;

  /**
   * Human-readable permission name.
   *
   * Intended for display, auditing, or administrative interfaces only.
   */
  name: string;
}

/**
 * Target descriptor for user profile retrieval.
 *
 * Used to distinguish between:
 * - self-profile access
 * - privileged access to another user's profile
 */
export type UserProfileTarget =
  | { type: 'self' }
  | { type: 'byId'; userId: string };

// -------------------------------------------------
// Async State Shapes
// -------------------------------------------------

/**
 * Base async state for user profile retrieval.
 *
 * `data` is null until successfully resolved.
 */
export type UserProfileAsyncState = AsyncState<UserProfile | null>;

/**
 * Async state for the authenticated user's own profile.
 */
export type UserSelfProfileState = UserProfileAsyncState;

/**
 * Async state for HR/Admin viewing another user's profile.
 */
export interface UserViewedProfileState extends UserProfileAsyncState {
  /**
   * The ID of the user currently being viewed.
   *
   * Used for route-driven HR/Admin profile pages and
   * to prevent stale data reuse across navigations.
   */
  viewedUserId: NullableString;
}

/**
 * Flattened, UI-optimized projection of `UserProfile`.
 *
 * Designed for list views, cards, tables, and grids.
 * Contains no nested structures to simplify rendering.
 */
export interface FlattenedUserProfile {
  // -------------------------------------------------
  // Core identity
  // -------------------------------------------------
  id: string;
  fullName: string;
  email: string;
  jobTitle: NullableString;
  isSystem: boolean;

  // -------------------------------------------------
  // Avatar (flattened projection)
  // -------------------------------------------------
  avatarUrl: NullableString;
  avatarFormat: ImageFileFormat | null;
  avatarUploadedAt: NullableString;

  // -------------------------------------------------
  // Role & permissions
  // -------------------------------------------------
  roleId: NullableString;
  roleName: NullableString;
  roleGroup: NullableString;
  hierarchyLevel: NullableNumber;

  /**
   * Flattened list of permission keys.
   *
   * Derived from `UserRole.permissions[].key`.
   * Intended solely for UI feature toggling.
   */
  permissions: string[];

  // -------------------------------------------------
  // Status
  // -------------------------------------------------
  statusId: NullableString;
  statusName: NullableString;
  statusDate: NullableString;

  // -------------------------------------------------
  // Audit (flattened for UI)
  // -------------------------------------------------
  createdAt: NullableString;
  createdById: NullableString;
  createdByName: NullableString;

  updatedAt: NullableString;
  updatedById: NullableString;
  updatedByName: NullableString;
}

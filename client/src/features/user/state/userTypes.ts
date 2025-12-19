import {
  DateRange,
  GenericAudit,
  GenericStatus,
  PaginatedResponse,
  PaginationParams,
  ReduxPaginatedState,
  SortConfig,
} from '@shared-types/api';

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
  avatarUrl?: string | null;
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
export type PaginatedUserCardListResponse =
  PaginatedResponse<UserCardView>;

/**
 * Paginated response for full user lists.
 */
export type PaginatedUserListResponse =
  PaginatedResponse<UserListView>;

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
export interface GetPaginatedUsersParams
  extends PaginationParams,
    SortConfig {
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
export type PaginatedUsersState =
  ReduxPaginatedState<UserCardView | UserListView>;

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
  userId: string | null;
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
  avatarUrl: string | null;
  
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


// Represents detailed information about a user's profile
export interface UserProfile {
  email: string;
  role: string;
  firstname: string;
  lastname: string;
  phone_number?: string | null; // Nullable field, optional for profile updates
  job_title: string;
  created_at: string; // ISO timestamp for creation date
  updated_at: string; // ISO timestamp for last update
}

// Response structure for user profile API requests
export interface UserProfileResponse {
  success: boolean; // Indicates whether the request was successful
  message: string; // Message describing the operation's result
  data: UserProfile; // The user profile object
  timestamp: string; // ISO timestamp when the response was generated
}

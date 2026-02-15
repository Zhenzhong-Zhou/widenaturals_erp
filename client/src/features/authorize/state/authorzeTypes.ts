import { ApiSuccessResponse } from '@shared-types/api';

/**
 * Permission payload returned by the authorization endpoint.
 *
 * Represents the minimal domain-level permission data associated
 * with the authenticated user.
 *
 * Notes:
 * - This interface intentionally excludes API envelope fields
 *   such as `success`, `message`, or `traceId`.
 * - It is designed to be composed with `ApiSuccessResponse<T>`
 *   at the transport boundary.
 */
export interface PermissionPayload {
  /** Canonical role name assigned to the user */
  roleName: string;

  /** List of permission keys granted to the role */
  permissions: string[];
}

/**
 * Successful permission response returned by the backend.
 *
 * Transport-level response type composed of the standard API
 * success envelope and the permission domain payload.
 *
 * @see ApiSuccessResponse
 */
export type PermissionResponse = ApiSuccessResponse<PermissionPayload>;

/**
 * Client-side permissions hook contract.
 *
 * Defines the public interface exposed by `usePermissions`.
 * Intended for consumption by permission-aware components,
 * route guards, and layout-level orchestration.
 *
 * Semantics:
 * - `roleName` and `permissions` represent the resolved
 *   effective access state of the authenticated user.
 * - Permission resolution is non-blocking and lifecycle-driven.
 * - Consumers MUST tolerate transient unresolved states.
 *
 * Lifecycle:
 * - Initial render may occur before permissions are ready
 * - Permission hydration occurs asynchronously
 * - Consumers should rely on `ready` to distinguish
 *   unresolved vs resolved permission state
 *
 * Architectural notes:
 * - This interface intentionally does NOT expose a generic
 *   "fetch permissions" API
 * - Permission loading is automatic and centralized
 * - Consumers must treat `refreshPermissions` as a privileged,
 *   non-routine operation
 */
export interface UsePermissions {
  /**
   * Resolved role name.
   *
   * `null` indicates that permission resolution has not
   * completed yet or the user is unauthenticated.
   */
  roleName: string | null;

  /**
   * Effective permission identifiers.
   *
   * Empty during initial resolution or when the user
   * has no explicit permissions.
   */
  permissions: string[];

  /**
   * Indicates whether permission hydration is currently in progress.
   *
   * Intended for diagnostic or transitional UI states only.
   * Most consumers should rely on `ready` instead.
   */
  loading: boolean;

  /**
   * Indicates whether permission resolution has completed.
   *
   * `true` means permission state is stable and safe
   * for access control decisions.
   *
   * This is the PRIMARY readiness signal for guards and UI logic.
   */
  ready: boolean;

  /**
   * Last non-recoverable permission error, if any.
   *
   * Recoverable or transient errors must not be surfaced here.
   */
  error: string | null;

  /**
   * Explicit permission revalidation.
   *
   * Intended ONLY for exceptional system flows such as:
   * - Role changes
   * - Privilege mutations
   * - Tenant or organization switches
   *
   * Authorization failures during refresh are treated
   * as fatal and may trigger a forced logout.
   */
  refreshPermissions: () => Promise<void>;
}

/**
 * Options for customizing permission checks.
 */
export type PermissionCheckOptions = {
  /**
   * If true, user must have **all** required permissions (AND logic).
   * If false or undefined, user only needs **one** (OR logic).
   *
   * @default false
   */
  requireAll?: boolean;

  /**
   * List of special permissions that **bypass all checks**.
   * If a user has any of these, permission check will always return true.
   *
   * Useful for root-level access (e.g., 'root_access', 'super_admin').
   *
   * @default ['root_access']
   */
  bypassPermissions?: string[];
};

/**
 * PermissionsState
 *
 * Represents the in-memory authorization context for the
 * currently authenticated user.
 *
 * This state describes *resolved permissions*, not identity.
 * It is derived from the active session and must be treated
 * as transient and non-durable.
 *
 * Lifecycle notes:
 * - Initialized empty on application start
 * - Reset automatically when the session is reset or invalidated
 * - Rehydrated only in memory (must NOT be persisted)
 *
 * Semantics:
 * - `roleName === null` indicates permissions have not yet
 *   been resolved or the user is unauthenticated
 * - `permissions` contains granted permission identifiers
 *   once resolved
 * - `loading` reflects an in-flight permission fetch
 * - `error` represents a recoverable fetch or resolution error
 *
 * Usage:
 * - Consumed by route guards, layouts, and permission-aware UI
 * - Must NOT be used as a source of truth for authentication
 * - Must NOT be persisted across reloads
 */
export interface PermissionsState {
  /** Resolved role name for the current user, or null if unknown */
  roleName: string | null;

  /** List of granted permission identifiers */
  permissions: string[];

  /** Indicates an in-flight permission fetch */
  loading: boolean;

  /**
   * Indicates at least one permission fetch attempt has completed.
   *
   * Prevents consumers from treating initial empty state as a
   * finalized authorization decision during app bootstrap.
   */
  resolved: boolean;

  /** Recoverable permission resolution error (non-fatal) */
  error: string | null;
}

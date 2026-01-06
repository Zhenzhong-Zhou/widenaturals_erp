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
 * Defines the public interface exposed by `usePermissions`,
 * intended for consumption by permission-aware components,
 * route guards, and layout-level logic.
 *
 * Semantics:
 * - `roleName` and `permissions` reflect the currently
 *   authenticated user's effective access level.
 * - `loading` indicates whether permission hydration is in progress.
 * - `error` contains the last non-recoverable permission error, if any.
 * - `refreshPermissions` provides an explicit, system-level escape hatch
 *   for revalidating permissions in rare scenarios.
 *
 * Architectural notes:
 * - This interface intentionally does not expose a generic
 *   "fetch permissions" function.
 * - Permission loading is automatic and lifecycle-driven.
 * - Consumers must treat `refreshPermissions` as a privileged,
 *   non-routine operation.
 */
export interface UsePermissions {
  /** Current role name, if available */
  roleName: string | null;
  
  /** Effective permission set derived from the role */
  permissions: string[];
  
  /** Indicates whether permissions are currently being loaded */
  loading: boolean;
  
  /** Last non-recoverable permission error, if any */
  error: string | null;
  
  /**
   * Explicit permission revalidation.
   *
   * Intended for rare system flows such as role changes,
   * privilege mutations, or tenant switches.
   *
   * Auth or authorization failures during refresh are treated
   * as unrecoverable and may result in a forced logout.
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
  
  /** Recoverable permission resolution error (non-fatal) */
  error: string | null;
}

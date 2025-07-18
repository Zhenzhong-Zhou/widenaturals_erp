// Adjusted interface to match the backend response
export interface PermissionResponse {
  success: boolean; // Indicates if the request was successful
  message: string; // Success or error message
  data: {
    roleName: string; // Role name returned from the backend
    permissions: string[]; // Array of permission keys
  };
}

// Updated UsePermissions interface for client-side usage
export interface UsePermissions {
  roleName: string; // Role name
  permissions: string[]; // Array of permission keys
  loading: boolean; // Loading state
  error: string | null; // Error message if any
  refreshPermissions: () => Promise<void>; // Function to refresh permissions
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

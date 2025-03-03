// Adjusted interface to match the backend response
export interface PermissionResponse {
  success: boolean; // Indicates if the request was successful
  message: string; // Success or error message
  data: {
    role_name: string; // Role name returned from the backend
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

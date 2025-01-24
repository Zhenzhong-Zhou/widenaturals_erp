export interface PermissionResponse {
  success: boolean;
  message: string;
  data: string[]; // Array of permission keys
}

export interface UsePermissions {
  permissions: string[];
  loading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
}

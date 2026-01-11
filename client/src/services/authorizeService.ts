import { getRequest } from '@utils/http';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type { PermissionResponse } from '@features/authorize';

/**
 * Fetches the authenticated user's role name and permission list.
 *
 * Responsibilities:
 * - Calls the permission endpoint using the standardized HTTP layer
 * - Validates and returns a normalized permission payload
 *
 * Error handling:
 * - Transport, network, and HTTP errors are normalized by `getRequest`
 * - This function only validates business-level response shape
 *
 * @returns Promise resolving to the user's role name and permissions
 */
export const fetchPermissions = async (): Promise<{
  roleName: string;
  permissions: string[];
}> => {
  const response = await getRequest<PermissionResponse>(
    API_ENDPOINTS.USER_PERMISSION
  );
  
  const { roleName, permissions } = response.data;
  
  if (!roleName || !permissions) {
    throw new Error(
      'Invalid permission response: roleName or permissions missing.'
    );
  }
  
  return { roleName, permissions };
};

export const authorizeService = {
  fetchPermissions,
};

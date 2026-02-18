import { getRequest } from '@utils/http';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type { PermissionResponse } from '@features/authorize';

/**
 * Fetch the authenticated user's role name and permission list.
 *
 * Responsibilities:
 * - Calls the permissions endpoint using the standardized HTTP layer
 * - Validates response structure
 * - Returns a normalized permission payload
 *
 * Guarantees:
 * - Stateless
 * - Safe for concurrent calls
 * - UI-agnostic
 *
 * @returns The authenticated user's role name and permissions
 * @throws {Error} If response shape is invalid
 */
export const fetchPermissions = async (): Promise<{
  roleName: string;
  permissions: string[];
}> => {
  const url = API_ENDPOINTS.SECURITY.PERMISSIONS.SELF;
  
  const response = await getRequest<PermissionResponse>(url, {
    policy: 'READ',
  });
  
  const { roleName, permissions } = response.data ?? {};
  
  if (!Array.isArray(permissions)) {
    throw new Error(
      'Invalid permission response: roleName or permissions missing.'
    );
  }
  
  return {
    roleName,
    permissions,
  };
};

export const authorizeService = {
  fetchPermissions,
};

import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { PermissionResponse } from '../features/authorize/state/authorzeTypes.ts';

/**
 * Fetch permissions and role name for the authenticated user.
 *
 * @returns {Promise<UsePermissions>} - Object containing role name, permissions, and helper methods.
 * @throws {Error} - Throws if the API call fails.
 */
const fetchPermissions = async (): Promise<{
  roleName: string;
  permissions: string[];
}> => {
  try {
    // Fetch the raw response from the backend
    const response = await axiosInstance.get<PermissionResponse>(
      API_ENDPOINTS.USER_PERMISSION
    );

    // Extract and transform data to match the expected return type
    const { role_name: roleName, permissions } = response.data.data;

    if (!roleName || !permissions) {
      throw new Error(
        'Invalid response format: Missing roleName or permissions.'
      );
    }

    return { roleName, permissions }; // Transform the response to the expected format
  } catch (error: any) {
    console.error('Error fetching permissions:', error.message);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch permissions'
    );
  }
};

export const authorizeService = {
  fetchPermissions,
};

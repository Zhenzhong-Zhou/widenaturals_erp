import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { PermissionResponse } from '../features/authorize/state/authorzeTypes.ts';

/**
 * Fetch permissions for the authenticated user.
 *
 * @returns {Promise<string[]>} - An array of permission keys.
 * @throws {Error} - Throws if the API call fails.
 */
const fetchPermissions = async (): Promise<PermissionResponse> => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.USER_PERMISSION);
    console.log(response);
    return response.data;
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
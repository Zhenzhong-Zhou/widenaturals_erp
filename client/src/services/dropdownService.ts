import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  GetBatchRegistryDropdownParams,
  GetBatchRegistryDropdownResponse,
} from '@features/dropdown/state/dropdownTypes';

/**
 * Fetches dropdown-compatible batch registry records.
 *
 * Supports filtering by batch type (e.g., 'product', 'packaging_material'),
 * exclusion of specific IDs, and pagination controls (limit/offset).
 *
 * @param params - Optional filters and pagination options.
 * @returns A promise resolving to the batch registry dropdown response.
 * @throws Throws an error if the network request fails.
 */
const fetchBatchRegistryDropdown = async (
  params: GetBatchRegistryDropdownParams = {}
): Promise<GetBatchRegistryDropdownResponse> => {
  try {
    const response = await axiosInstance.get<GetBatchRegistryDropdownResponse>(
      API_ENDPOINTS.DROPDOWN.BATCH_REGISTRY,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch batch registry dropdown:', error);
    throw error;
  }
};

export const dropdownService = {
  fetchBatchRegistryDropdown,
};

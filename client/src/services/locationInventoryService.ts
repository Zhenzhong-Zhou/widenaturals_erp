import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  LocationInventoryQueryParams,
  LocationInventorySummaryResponse
} from '@features/locationInventory/state';
import { AppError } from '@utils/AppError';

/**
 * Fetch all inventory summaries (product or material) with pagination, filters, and sorting.
 * @param {LocationInventoryQueryParams} params - Filter and pagination options
 * @returns {Promise<LocationInventorySummaryResponse>} The response containing summary data.
 */
export const fetchLocationInventorySummary = async (
  params: LocationInventoryQueryParams
): Promise<LocationInventorySummaryResponse> => {
  try {
    const response = await axiosInstance.get<LocationInventorySummaryResponse>(
      API_ENDPOINTS.LOCATION_INVENTORY_SUMMARY,
      { params }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching inventory summary:', error);
    throw new AppError(
      error.response?.data?.message || 'Failed to fetch inventory summary'
    );
  }
};

export const locationInventoryService = {
  fetchLocationInventorySummary,
};

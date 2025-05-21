import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  LocationInventoryQueryParams,
  LocationInventorySummaryDetailResponse,
  LocationInventorySummaryResponse
} from '@features/locationInventory/state';
import { AppError } from '@utils/AppError';
import type { InventorySummaryDetailByItemIdParams } from '@features/inventoryShared/types/InventorySharedType';

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

/**
 * Fetches location inventory summary detail records by item ID.
 *
 * @param {InventorySummaryDetailByItemIdParams} params - The item ID and optional pagination values.
 * @returns {Promise<LocationInventorySummaryDetailResponse>} A promise resolving to inventory summary details and pagination metadata.
 * @throws Will throw an error if the request fails.
 */
export const fetchLocationInventorySummaryByItemId = async (
  params: InventorySummaryDetailByItemIdParams
): Promise<LocationInventorySummaryDetailResponse> => {
  const { itemId, page = 1, limit = 10 } = params;
  const endpoint = API_ENDPOINTS.LOCATION_INVENTORY_SUMMARY_DETAIL.replace(':itemId', itemId);
  
  try {
    const response = await axiosInstance.get<LocationInventorySummaryDetailResponse>(endpoint,
      { params: { page, limit } }
    );
    
    return response.data;
  } catch (error) {
    
    throw new Error('Failed to fetch location inventory summary detail.');
  }
};

export const locationInventoryService = {
  fetchLocationInventorySummary,
  fetchLocationInventorySummaryByItemId,
};

import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  LocationInventoryKpiSummaryResponse,
  LocationInventoryQueryParams,
  LocationInventorySummaryDetailResponse,
  LocationInventorySummaryResponse,
} from '@features/locationInventory/state';
import { AppError } from '@utils/AppError';
import type {
  InventorySummaryDetailByItemIdParams,
  ItemType,
} from '@features/inventoryShared/types/InventorySharedType';

/**
 * Fetches KPI summary for location inventory.
 *
 * @param {ItemType} [itemType] - Optional filter by item type ('product' or 'packaging_material').
 * @returns {Promise<LocationInventoryKpiSummaryResponse>} A promise resolving to the KPI summary response.
 * @throws Will throw an error if the API request fails.
 */
const fetchLocationInventoryKpiSummary = async (
  itemType?: ItemType
): Promise<LocationInventoryKpiSummaryResponse> => {
  try {
    const response = await axiosInstance.get<LocationInventoryKpiSummaryResponse>(
      API_ENDPOINTS.LOCATION_INVENTORY.KPI_SUMMARY,
      {
        params: itemType ? { itemType } : {},
      }
    );
    
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch location inventoryKpiSummary');
  }
};

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
      API_ENDPOINTS.LOCATION_INVENTORY.SUMMARY,
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
  const endpoint = API_ENDPOINTS.LOCATION_INVENTORY.SUMMARY_DETAIL(itemId);
  
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
  fetchLocationInventoryKpiSummary,
  fetchLocationInventorySummary,
  fetchLocationInventorySummaryByItemId,
};

import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { InventoryResponse, InventorySummaryResponse } from '../features/inventory';
import { AppError } from '@utils/AppError.tsx';

/**
 * Fetch all inventory items from the server with pagination, sorting, and error handling.
 * @param {number} page - Current page number (default: 1)
 * @param {number} limit - Number of items per page (default: 10)
 * @param {string} sortBy - Column to sort by (default: 'created_at')
 * @param {string} sortOrder - Sort order (ASC/DESC, default: 'DESC')
 * @returns {Promise<InventoryResponse>} The response containing inventory data.
 */
const fetchAllInventories = async (
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'location_id, created_at',
  sortOrder: string = 'DESC'
): Promise<InventoryResponse> => {
  try {
    const response = await axiosInstance.get<InventoryResponse>(
      API_ENDPOINTS.ALL_INVENTORIES,
      {
        params: { page, limit, sortBy, sortOrder },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching inventories:', error);
    throw new AppError(
      error.response?.data?.message || 'Failed to fetch inventories'
    );
  }
};

/**
 * Fetches a paginated inventory summary list from the server.
 *
 * @param {number} [page=1] - The current page number (default is 1).
 * @param {number} [limit=10] - The number of records per page (default is 10).
 * @returns {Promise<InventorySummaryResponse>} - The inventory summary result with pagination.
 * @throws {AppError} - Throws error when the request fails.
 */
export const fetchInventorySummary = async (
  page: number = 1,
  limit: number = 10
): Promise<InventorySummaryResponse> => {
  try {
    const response = await axiosInstance.get<InventorySummaryResponse>(
      API_ENDPOINTS.INVENTORY_SUMMARY,
      {
        params: { page, limit },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching inventory summary:', error);
    throw new AppError(
      error.response?.data?.message || 'Unable to fetch inventory summary'
    );
  }
};

export const inventoryService = {
  fetchAllInventories,
  fetchInventorySummary,
};

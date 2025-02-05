import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { WarehouseInventoryResponse } from '../features/warehouse-inventory';
import { AppError } from '@utils/AppError.tsx';

/**
 * Fetches all warehouse inventories with pagination.
 * @param {number} page - The current page number (default: 1)
 * @param {number} limit - The number of records per page (default: 10)
 * @returns {Promise<WarehouseInventoryResponse>} Warehouse inventory response
 * @throws {AppError} If the API request fails
 */
const fetchAllWarehouseInventories = async (
  page: number = 1,
  limit: number = 10,
): Promise<WarehouseInventoryResponse> => {
  try {
    const response = await axiosInstance.get<WarehouseInventoryResponse>(
      `${API_ENDPOINTS.ALL_WAREHOUSE_INVENTORIES}?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouse inventories:', error);
    
    // Throw a custom error with a meaningful message
    throw new AppError('Failed to fetch warehouse inventories. Please try again.');
  }
};

// Export the service
export const warehouseInventoryService = {
  fetchAllWarehouseInventories,
};

import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { WarehouseInventoryResponse, WarehouseInventorySummaryResponse, WarehouseProductSummaryResponse, WarehouseInventoryDetailsResponse } from '../features/warehouse-inventory';
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

/**
 * Fetches the warehouse inventory summary from the backend.
 *
 * @param {number} page - The page number for pagination (default: 1).
 * @param {number} limit - The number of records per page (default: 10).
 * @param {string} [status] - Optional filter by warehouse status (`active`, `inactive`, `all`).
 * @returns {Promise<WarehouseInventorySummaryResponse>} - The warehouse inventory summary data.
 */
export const fetchWarehouseInventorySummary = async (
  page: number = 1,
  limit: number = 10,
  status?: string, // Optional status (default is no filter)
): Promise<WarehouseInventorySummaryResponse> => {
  try {
    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      throw new Error('Page and limit must be positive numbers.');
    }
    
    // Construct API URL with query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    // Only add status to the request if it's provided (avoids unnecessary filtering)
    if (status) {
      queryParams.append('status', status);
    }
    
    const response = await axiosInstance.get<WarehouseInventorySummaryResponse>(
      `${API_ENDPOINTS.WAREHOUSE_INVENTORIES_SUMMARY}?${queryParams.toString()}`
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouse inventory summary:', error);
    
    // Return a safe default response or throw a custom error
    throw new Error('Failed to fetch warehouse inventory summary. Please try again later.');
  }
};

/**
 * Fetches the warehouse product summary from the backend.
 *
 * @param {string} warehouseId - The ID of the warehouse.
 * @param {number} page - The page number for pagination (default: 1).
 * @param {number} limit - The number of records per page (default: 10).
 * @returns {Promise<WarehouseProductSummaryResponse>} - The warehouse product summary data.
 */
export const fetchWarehouseProductSummary = async (
  warehouseId: string,
  page: number = 1,
  limit: number = 10
): Promise<WarehouseProductSummaryResponse> => {
  try {
    const endpoint = API_ENDPOINTS.WAREHOUSE_PRODUCTS_SUMMARY.replace(':id', warehouseId);
    const response = await axiosInstance.get<WarehouseProductSummaryResponse>(
      `${endpoint}?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouse product summary:', error);
    throw new AppError('Failed to fetch warehouse product summary. Please try again later.');
  }
};

export const fetchWarehouseInventoryDetails = async (
  warehouseId: string,
  page: number = 1,
  limit: number = 10
): Promise<WarehouseInventoryDetailsResponse> => {
  try {
    const endpoint = API_ENDPOINTS.WAREHOUSE_INVENTORY_DETAILS.replace(':id', warehouseId);
    const response = await axiosInstance.get<WarehouseInventoryDetailsResponse>(
      `${endpoint}?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouse inventory details:', error);
    throw new AppError('Failed to fetch warehouse inventory details. Please try again later.');
  }
};

// Export the service
export const warehouseInventoryService = {
  fetchAllWarehouseInventories,
  fetchWarehouseInventorySummary,
  fetchWarehouseProductSummary,
  fetchWarehouseInventoryDetails,
};

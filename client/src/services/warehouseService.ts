import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { WarehouseResponse } from '../features/warehouse';
import { AppError } from '@utils/AppError.tsx';

const fetchAllWarehouses = async (page: number, limit: number): Promise<WarehouseResponse> => {
  try {
    const response = await axiosInstance.get<WarehouseResponse>(`${API_ENDPOINTS.ALL_WAREHOUSES}?page=${page}&limit=${limit}`)
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw new AppError('Failed to fetch warehouses');
  }
}

export const warehouseService = {
  fetchAllWarehouses,
};

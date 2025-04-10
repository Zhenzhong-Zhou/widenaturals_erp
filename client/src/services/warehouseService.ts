import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import {
  WarehouseDetailsResponse,
  WarehouseResponse,
} from '@features/warehouse';
import { AppError } from '@utils/AppError';

const fetchAllWarehouses = async (
  page: number,
  limit: number
): Promise<WarehouseResponse> => {
  try {
    const response = await axiosInstance.get<WarehouseResponse>(
      `${API_ENDPOINTS.ALL_WAREHOUSES}?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw new AppError('Failed to fetch warehouses');
  }
};

const fetchWarehouseDetails = async (
  warehouseId: string
): Promise<WarehouseDetailsResponse | null> => {
  try {
    const endpoint = API_ENDPOINTS.WAREHOUSE_DETAILS.replace(
      ':id',
      warehouseId
    );
    const response =
      await axiosInstance.get<WarehouseDetailsResponse>(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouse details:', error);
    throw new AppError('Failed to fetch warehouse details');
  }
};

export const warehouseService = {
  fetchAllWarehouses,
  fetchWarehouseDetails,
};

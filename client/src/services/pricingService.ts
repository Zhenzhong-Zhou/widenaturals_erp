import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { PricingResponse } from '../features/pricing';

const fetchAllPricings = async (page: number, limit: number): Promise<PricingResponse> => {
  try {
    const response = await axiosInstance.get<PricingResponse>(
      `${API_ENDPOINTS.ALL_PRICINGS}?page=${page}&limit=${limit}`
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch pricings');
  }
};

export const pricingService = {
  fetchAllPricings,
};

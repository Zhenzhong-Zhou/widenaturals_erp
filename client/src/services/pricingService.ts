import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { PricingDetailsResponse, PricingResponse } from '../features/pricing';

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

/**
 * Fetch pricing details by pricing ID.
 * @param pricingId - The UUID of the pricing record.
 * @param page - Page number for pagination.
 * @param limit - Number of records per page.
 * @returns A promise that resolves to pricing details.
 */
export const fetchPricingDetails = async (pricingId: string, page = 1, limit = 10): Promise<PricingDetailsResponse> => {
  try {
    const endpoint = API_ENDPOINTS.PRICING_DETAILS.replace(':id', pricingId);
    console.log(endpoint);
    const response = await axiosInstance.get<PricingDetailsResponse>(`${endpoint}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch pricing details');
  }
};

export const pricingService = {
  fetchAllPricings,
  fetchPricingDetails
};

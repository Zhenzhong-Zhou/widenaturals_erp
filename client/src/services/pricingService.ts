import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { PricingDetailsResponse, PricingResponse } from '../features/pricing';
import { PriceRequestParams, PriceResponse } from '../features/pricing';

const fetchAllPricings = async (
  page: number,
  limit: number
): Promise<PricingResponse> => {
  try {
    const response = await axiosInstance.get<PricingResponse>(
      `${API_ENDPOINTS.ALL_PRICINGS}?page=${page}&limit=${limit}`
    );
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
const fetchPricingDetails = async (
  pricingId: string,
  page = 1,
  limit = 10
): Promise<PricingDetailsResponse> => {
  try {
    const endpoint = API_ENDPOINTS.PRICING_DETAILS.replace(':id', pricingId);
    const response = await axiosInstance.get<PricingDetailsResponse>(
      `${endpoint}?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch pricing details');
  }
};

const fetchPriceByProductIdAndPriceTypeId = async (params: PriceRequestParams): Promise<PriceResponse> => {
  try {
    const response = await axiosInstance.get<PriceResponse>(API_ENDPOINTS.PRICE_VALUE, {
      params
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch price:", error);
    throw new Error('Failed to fetch price');
  }
};

export const pricingService = {
  fetchAllPricings,
  fetchPricingDetails,
  fetchPriceByProductIdAndPriceTypeId,
};

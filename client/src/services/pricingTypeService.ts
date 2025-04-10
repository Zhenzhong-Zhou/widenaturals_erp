import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import {
  PricingTypeResponse,
  PricingTypesResponse,
} from '@features/pricingType';

const fetchAllPricingTypes = async (
  page: number,
  limit: number
): Promise<PricingTypesResponse> => {
  try {
    const response = await axiosInstance.get<PricingTypesResponse>(
      `${API_ENDPOINTS.ALL_PRICING_TYPES}?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch pricing types');
  }
};

const fetchPricingTypeDetailsById = async (
  pricingTypeId: string,
  page: number,
  limit: number
): Promise<PricingTypeResponse> => {
  try {
    const endpoint = API_ENDPOINTS.PRICING_TYPE_DETAILS.replace(
      ':id',
      pricingTypeId
    );
    const response = await axiosInstance.get<PricingTypeResponse>(
      `${endpoint}?page=${page}&limit=${limit}`
    );
    return response.data; // Return the fetched data
  } catch (error) {
    throw new Error('Failed to fetch pricing type details');
  }
};

export const pricingTypeService = {
  fetchAllPricingTypes,
  fetchPricingTypeDetailsById,
};

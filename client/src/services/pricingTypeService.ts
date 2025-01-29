import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { PricingTypesResponse } from '../features/pricingTypes';

const fetchAllPricingTypes = async (): Promise<PricingTypesResponse> => {
  try {
    const response = await axiosInstance.get<PricingTypesResponse>(API_ENDPOINTS.ALL_PRICING_TYPES);
    console.log(response);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch pricing types');
  }
};

export const pricingTypeService = {
  fetchAllPricingTypes
};
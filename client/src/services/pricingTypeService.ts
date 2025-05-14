import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type { FetchPricingTypesParams } from '@features/pricingType/state';
import type {
  PricingType,
  PricingTypeResponse,
} from '@features/pricingType';
import type { PaginatedResponse } from 'types/api';

/**
 * Fetches a paginated list of pricing types with optional filters.
 *
 * This client function calls the backend API to retrieve pricing type records,
 * supporting optional filters such as search keyword (`name`), and a date range.
 *
 * @param {FetchPricingTypesParams} params - Query parameters including pagination and optional filters:
 * - `page` (number): Page number for pagination (default is 1).
 * - `limit` (number): Number of records per page (default is 10).
 * - `name` (string): Optional search keyword for name or code.
 * - `startDate` (string): Optional start date (ISO string) for status_date filtering.
 * - `endDate` (string): Optional end date (ISO string) for status_date filtering.
 *
 * @returns {Promise<PaginatedResponse<PricingType>>} - A promise resolving to a paginated list of pricing types.
 *
 * @throws {Error} Throws an error if the request fails.
 */
const fetchAllPricingTypes = async (
  params: FetchPricingTypesParams
): Promise<PaginatedResponse<PricingType>> => {
  try {
    const response = await axiosInstance.get<PaginatedResponse<PricingType>>(
      API_ENDPOINTS.PRICING_TYPES,
      { params }
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

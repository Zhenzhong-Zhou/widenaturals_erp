import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  FetchPricingTypesParams,
  PricingTypeMetadataResponse,
} from '@features/pricingType/state';
import type { PricingType } from '@features/pricingType';
import type { PaginatedResponse } from '@shared-types/api';

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

/**
 * Fetches metadata for a single pricing type by ID.
 *
 * @param {string} pricingTypeId - The UUID of the pricing type to fetch.
 * @returns {Promise<PricingTypeMetadataResponse>} The metadata response.
 * @throws {Error} If the request fails.
 */
export const fetchPricingTypeMetadataById = async (
  pricingTypeId: string,
): Promise<PricingTypeMetadataResponse> => {
  try {
    const endpoint = API_ENDPOINTS.PRICING_TYPE_METADATA.replace(':id', pricingTypeId);
    const response = await axiosInstance.get<PricingTypeMetadataResponse>(endpoint);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error.message || 'Unknown error';
    throw new Error(`Failed to fetch pricing type metadata: ${message}`);
  }
};

export const pricingTypeService = {
  fetchAllPricingTypes,
  fetchPricingTypeMetadataById,
};

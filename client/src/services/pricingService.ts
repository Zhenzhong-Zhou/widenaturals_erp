import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type { FetchPricingParams, PaginatedPricingRecordsResponse } from '@features/pricing/state';
import type { PriceRequestParams, PriceResponse } from '@features/pricing';

/**
 * Fetch paginated pricing records with optional filters and sorting.
 *
 * @param params - Query options: page, limit, sortBy, filters, keyword.
 * @returns Paginated list of pricing records.
 */
export const fetchPaginatedPricingRecords = async (
  params: FetchPricingParams = {}
): Promise<PaginatedPricingRecordsResponse> => {
  try {
    const { filters = {}, ...rest } = params;
    
    const flatParams = {
      ...rest,
      ...filters,
    };
    
    const response = await axiosInstance.get<PaginatedPricingRecordsResponse>(
      API_ENDPOINTS.PRICING_LIST,
      { params: flatParams }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch pricing records', error);
    throw new Error('Failed to fetch pricing records');
  }
};

/**
 * Fetch pricing details by pricing ID.
 * @param pricingId - The UUID of the pricing record.
 * @param page - Page number for pagination.
 * @param limit - Number of records per page.
 * @returns A promise that resolves to pricing details.
 */
// const fetchPricingDetails = async (
//   pricingId: string,
//   page = 1,
//   limit = 10
// ): Promise<PricingDetailsResponse> => {
//   try {
//     const endpoint = API_ENDPOINTS.PRICING_DETAILS.replace(':id', pricingId);
//     const response = await axiosInstance.get<PricingDetailsResponse>(
//       `${endpoint}?page=${page}&limit=${limit}`
//     );
//     return response.data;
//   } catch (error) {
//     throw new Error('Failed to fetch pricing details');
//   }
// };

const fetchPriceByProductIdAndPriceTypeId = async (
  params: PriceRequestParams
): Promise<PriceResponse> => {
  try {
    const response = await axiosInstance.get<PriceResponse>(
      API_ENDPOINTS.PRICE_VALUE,
      {
        params,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch price:', error);
    throw new Error('Failed to fetch price');
  }
};

export const pricingService = {
  fetchPaginatedPricingRecords,
  // fetchPricingDetails,
  fetchPriceByProductIdAndPriceTypeId,
};

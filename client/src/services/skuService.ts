import type {
  PaginatedSkuProductCardResponse,
  SkuDetailResponse,
  SkuProductCardFilters,
} from '@features/product/state';
import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from './apiEndpoints';
import type { AxiosError } from 'axios';
import { sanitizeString } from '@utils/stringUtils.ts';
import { getRequest } from '@utils/apiRequest.ts';
import type { GetSkuDetailResponse } from '@features/sku/state/skuTypes';

/**
 * Fetch a paginated list of active SKU product cards with optional filters.
 * Supports filtering by brand, category, marketRegion, sizeLabel, and keyword.
 *
 * @param page - Current page number (default: 1)
 * @param limit - Number of items per page (default: 10)
 * @param filters - Optional filters for SKU listing
 * @returns A paginated response containing SKU product card data
 */
const fetchActiveSkuProductCards = async (
  page: number = 1,
  limit: number = 10,
  filters: SkuProductCardFilters = {}
): Promise<PaginatedSkuProductCardResponse> => {
  try {
    const response = await axiosInstance.get<PaginatedSkuProductCardResponse>(
      API_ENDPOINTS.ACTIVE_SKU_PRODUCT_CARDS,
      {
        params: {
          page,
          limit,
          sortBy: 'name,created_at',
          sortOrder: 'DESC',
          ...filters,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch active SKU product cards:', error);
    throw new Error(
      error.response?.data?.message || 'Unable to fetch SKU product cards'
    );
  }
};

/**
 * Fetches detailed SKU information with pricing, compliance, and image metadata.
 *
 * @param skuId - UUID of the SKU to fetch
 * @returns Promise resolving to ApiSuccessResponse containing SkuDetail
 * @throws Error if the request fails or skuId is missing
 */
export const getSkuDetails = async (
  skuId: string
): Promise<SkuDetailResponse> => {
  if (!skuId) {
    throw new Error('SKU ID is required to fetch details.');
  }

  const endpoint = API_ENDPOINTS.SKU_DETAILS.replace(
    ':skuId',
    encodeURIComponent(skuId)
  );

  try {
    const response = await axiosInstance.get<SkuDetailResponse>(endpoint);
    return response.data;
  } catch (error) {
    // Optional: Add logging or rewrap error here
    throw error as AxiosError;
  }
};

/**
 * Fetch a single SKU's full detail record by ID.
 *
 * Issues `GET /skus/:skuId/details` and returns the standard API envelope
 * `ApiSuccessResponse<SkuDetail>`.
 *
 * Notes:
 * - No query flags are supported for this endpoint.
 * - Ensure `API_ENDPOINTS.SKUS.SKU_DETAILS` has the form:
 *     SKU_DETAILS: (skuId: string) => `/skus/${skuId}/details`
 *
 * @param skuId - SKU UUID string (trimmed before use).
 * @returns A promise resolving to the SKU detail response.
 * @throws Rethrows any error from the request helper.
 *
 * @example
 * const res = await fetchSkuDetailById('67ebf082-dea8-4297-a59d-13acb79d48a4');
 * console.log(res.data.product.displayName);
 */
const fetchSkuDetailById = async (
  skuId: string
): Promise<GetSkuDetailResponse> => {
  const cleanId = sanitizeString(skuId);
  const url = API_ENDPOINTS.SKUS.SKU_DETAILS(cleanId);
  
  try {
    return await getRequest<GetSkuDetailResponse>(url);
  } catch (error) {
    console.error('Failed to fetch SKU details:', {
      skuId: cleanId,
      error,
    });
    throw error;
  }
};

export const skuService = {
  fetchActiveSkuProductCards,
  getSkuDetails,
  fetchSkuDetailById
};

import type { PaginatedSkuProductCardResponse, SkuProductCardFilters } from "@features/product/state";
import axiosInstance from "@utils/axiosConfig";
import { API_ENDPOINTS } from "./apiEndpoints";

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

export const skuService = {
  fetchActiveSkuProductCards,
};

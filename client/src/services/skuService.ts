import type {
  FetchSkusParams,
  GetSkuDetailResponse, GetSkuListResponse,
  GetSkuProductCardsResponse,
  SkuProductCardQueryParams,
} from '@features/sku/state/skuTypes';
import { API_ENDPOINTS } from './apiEndpoints';
import { sanitizeString } from '@utils/stringUtils';
import { getRequest } from '@utils/apiRequest';
import { buildQueryString } from '@utils/buildQueryString';

/**
 * Fetch a paginated list of SKU product-card records.
 *
 * Issues:
 *   GET /skus/cards?page={page}&limit={limit}&sortBy={col}&sortOrder={order}&...
 *
 * Returns the standard envelope:
 *   ApiSuccessResponse<SkuProductCard[]>
 *
 * Notes:
 * - Query parameters should already be normalized (pagination, sorting, filters).
 * - Ensure `API_ENDPOINTS.SKUS.SKU_PRODUCT_CARDS` has the form:
 *     SKU_PRODUCT_CARDS: '/skus/cards'
 *
 * @param params - Pagination + filter options for the SKU product-card list.
 * @returns A promise resolving to the SKU product card response.
 * @throws Rethrows any error from the request helper.
 *
 * @example
 * const res = await fetchPaginatedSkuProductCards({
 *   page: 1,
 *   limit: 20,
 *   sortBy: 'p.name',
 *   sortOrder: 'ASC',
 *   filters: { keyword: 'Menopause' }
 * });
 * console.log(res.data[0].displayName);
 */
const fetchPaginatedSkuProductCards = async (
  params: SkuProductCardQueryParams = {}
): Promise<GetSkuProductCardsResponse> => {
  const { filters = {}, ...rest } = params;
  
  // Flatten nested filters into top-level query keys
  const flatParams = {
    ...rest,
    ...filters,
  };
  
  // Build full URL with query string
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.SKUS.SKU_PRODUCT_CARDS}${queryString}`;
  
  try {
    return await getRequest<GetSkuProductCardsResponse>(url);
  } catch (error) {
    console.error("Failed to fetch SKU product cards:", {
      params,
      error,
    });
    throw error;
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

/**
 * Fetch a paginated list of SKUs.
 *
 * Issues:
 *   GET /skus?page={page}&limit={limit}&sortBy={col}&sortOrder={order}&...
 *
 * Standard response:
 *   PaginatedResponse<SkuListItem>
 *
 * Notes:
 * - Filters are provided in `params.filters`.
 * - Function flattens them into top-level query parameters.
 *
 * @param params - Pagination, sorting, and SKU filter options.
 * @returns A promise resolving to paginated SKU list response.
 * @throws Rethrows any request helper error.
 *
 * @example
 * const res = await fetchPaginatedSkus({
 *   page: 1,
 *   limit: 20,
 *   sortBy: 'skuCode',
 *   sortOrder: 'ASC',
 *   filters: { keyword: 'DHA' }
 * });
 *
 * console.log(res.data[0].sku);
 */
const fetchPaginatedSkus = async (
  params: FetchSkusParams = {}
): Promise<GetSkuListResponse> => {
  const { filters = {}, ...rest } = params;
  
  // Flatten nested filters -> query params
  const flatParams = {
    ...rest,
    ...filters,
  };
  
  // Build ?page=…&limit=…&...
  const queryString = buildQueryString(flatParams);
  
  // Full endpoint
  const url = `${API_ENDPOINTS.SKUS.ALL_RECORDS}${queryString}`;
  
  try {
    return await getRequest<GetSkuListResponse>(url);
  } catch (error) {
    console.error("Failed to fetch SKUs:", {
      params,
      error,
    });
    throw error;
  }
};

export const skuService = {
  fetchPaginatedSkuProductCards,
  fetchSkuDetailById,
  fetchPaginatedSkus,
};

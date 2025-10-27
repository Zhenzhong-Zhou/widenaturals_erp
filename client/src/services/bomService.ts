import type {
  FetchBomsParams,
  FetchPaginatedBomsResponse,
} from '@features/bom/state/bomTypes';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { buildQueryString } from '@utils/buildQueryString';
import { getRequest } from '@utils/apiRequest';

/**
 * Fetch a paginated and filtered list of BOMs.
 *
 * Issues `GET /boms` with optional query parameters for pagination, sorting, and filters.
 *
 * Notes:
 * - Nested `filters` are flattened into top-level query keys before serialization.
 * - Expects a standard paginated API response structure.
 *
 * @param params - Optional pagination, sorting, and filtering parameters.
 * @returns A promise resolving to a paginated list of BOMs with metadata.
 * @throws Rethrows any network or parsing error from the request helper.
 *
 * @example
 * const res = await bomService.fetchPaginatedBoms({
 *   page: 1,
 *   limit: 10,
 *   filters: { isActive: true },
 * });
 * console.log(res.data[0].bom.code);
 */
const fetchPaginatedBoms = async (
  params: FetchBomsParams = {}
): Promise<FetchPaginatedBomsResponse> => {
  const { filters = {}, ...rest } = params;
  
  // Flatten nested filters into top-level query keys
  const flatParams = {
    ...rest,
    ...filters,
  };
  
  // Build full URL with query string
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.BOMS.ALL_RECORDS}${queryString}`;
  
  try {
    return await getRequest<FetchPaginatedBomsResponse>(url);
  } catch (error) {
    console.error('Failed to fetch BOM list:', { params: flatParams, error });
    throw error;
  }
};

export const bomService = {
  fetchPaginatedBoms,
};

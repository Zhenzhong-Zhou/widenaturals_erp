import type {
  BatchRegistryQueryParams,
  PaginatedBatchRegistryApiResponse,
} from '@features/batchRegistry';
import { buildQueryString } from '@utils/buildQueryString';
import { getRequest } from '@utils/http';
import { API_ENDPOINTS } from '@services/apiEndpoints';

/**
 * Fetch a paginated list of batch registry records.
 *
 * Responsibilities:
 * - Serializes pagination, sorting, and filter parameters into a query string
 * - Issues a READ-only HTTP request to the batch registry endpoint
 * - Preserves backend pagination metadata without transformation
 * - Returns a typed, paginated batch registry response
 *
 * Notes:
 * - Filters are provided in `params.filters`
 * - Date range filters are flattened into top-level query parameters:
 *   - expiryAfter, expiryBefore
 *   - registeredAfter, registeredBefore
 * - Multi-select filters (IDs) may be passed as arrays or comma-separated values
 * - Errors are normalized and propagated by the transport layer
 *
 * Guarantees:
 * - Stateless and side-effect free
 * - Safe for concurrent calls
 * - UI-agnostic and reusable across thunks and loaders
 *
 * @param params - Pagination, sorting, and batch registry filter options
 * @returns A paginated batch registry response with pagination metadata
 * @throws {AppError} When the request fails
 */
const fetchPaginatedBatchRegistry = async (
  params: BatchRegistryQueryParams = {}
): Promise<PaginatedBatchRegistryApiResponse> => {
  const { filters = {}, ...rest } = params;
  
  const {
    expiryAfter,
    expiryBefore,
    registeredAfter,
    registeredBefore,
    ...otherFilters
  } = filters;
  
  /**
   * Flatten date filters → query params
   */
  const flatDateParams: Record<string, string> = {};
  
  if (expiryAfter) flatDateParams.expiryAfter = expiryAfter;
  if (expiryBefore) flatDateParams.expiryBefore = expiryBefore;
  if (registeredAfter) flatDateParams.registeredAfter = registeredAfter;
  if (registeredBefore) flatDateParams.registeredBefore = registeredBefore;
  
  /**
   * Final flattened params
   */
  const flatParams = {
    ...rest,
    ...otherFilters,
    ...flatDateParams,
  };
  
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.BATCH_REGISTRY.ALL_RECORDS}${queryString}`;
  
  return getRequest<PaginatedBatchRegistryApiResponse>(url, {
    policy: 'READ',
  });
};

/* =========================================================
 * Public API
 * ======================================================= */

/**
 * Batch registry service.
 *
 * Encapsulates all backend interactions related to
 * batch registry data retrieval.
 */
export const batchRegistryService = {
  fetchPaginatedBatchRegistry,
};

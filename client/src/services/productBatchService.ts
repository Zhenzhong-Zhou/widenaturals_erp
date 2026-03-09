import type {
  ProductBatchQueryParams,
  PaginatedProductBatchApiResponse,
} from '@features/productBatch';
import { buildQueryString, flattenListQueryParams } from '@utils/query';
import { getRequest } from '@utils/http';
import { API_ENDPOINTS } from '@services/apiEndpoints';

/**
 * Fetch a paginated list of product batch records.
 *
 * Responsibilities:
 * - Serializes pagination, sorting, and filter parameters into a query string
 * - Issues a READ-only HTTP request to the product batch endpoint
 * - Preserves backend pagination metadata without transformation
 * - Returns a typed, paginated product batch response
 *
 * Notes:
 * - Filters are provided via `params.filters`
 * - Date range filters are flattened into top-level query parameters:
 *   - expiryAfter, expiryBefore
 *   - manufactureAfter, manufactureBefore
 *   - receivedAfter, receivedBefore
 *   - createdAfter, createdBefore
 * - Multi-select filters (IDs) may be passed as arrays or comma-separated values
 * - Errors are normalized and propagated by the transport layer
 *
 * Guarantees:
 * - Stateless and side-effect free
 * - Safe for concurrent calls
 * - UI-agnostic and reusable across thunks, loaders, and RTK Query
 *
 * @param params - Pagination, sorting, and product batch filter options
 * @returns A paginated product batch response with pagination metadata
 * @throws {AppError} When the request fails
 */
const fetchPaginatedProductBatches = async (
  params: ProductBatchQueryParams = {}
): Promise<PaginatedProductBatchApiResponse> => {
  const flatParams = flattenListQueryParams(params, [
    'expiryAfter',
    'expiryBefore',
    'manufactureAfter',
    'manufactureBefore',
    'receivedAfter',
    'receivedBefore',
    'createdAfter',
    'createdBefore',
  ]);

  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.PRODUCT_BATCHES.ALL_RECORDS}${queryString}`;

  return getRequest<PaginatedProductBatchApiResponse>(url, {
    policy: 'READ',
  });
};

/* =========================================================
 * Public API
 * ======================================================= */

/**
 * Product batch service.
 *
 * Encapsulates all backend interactions related to
 * product batch data retrieval.
 */
export const productBatchService = {
  fetchPaginatedProductBatches,
};

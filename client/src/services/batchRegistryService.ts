import {
  BatchRegistryQueryParams,
  PaginatedBatchRegistryListResponse,
} from '@features/batchRegistry';
import { buildQueryString } from '@utils/buildQueryString';
import { getRequest } from '@utils/http';
import { API_ENDPOINTS } from '@services/apiEndpoints';

/**
 * Fetch a paginated list of batch registry records from the backend.
 *
 * Responsibilities:
 * - Delegates query parameter serialization to `buildQueryString`
 * - Issues a READ-only HTTP request to the batch registry endpoint
 * - Preserves backend pagination metadata without transformation
 * - Returns a typed, paginated batch registry response
 *
 * This service function is intentionally:
 * - Stateless
 * - Side-effect free
 * - UI-agnostic
 *
 * It is safe to be called by:
 * - Redux thunks
 * - Server-side data loaders
 * - Background refresh workflows
 *
 * @param params - Pagination, sorting, and batch registry filter parameters
 * @returns A paginated batch registry response
 */
const fetchPaginatedBatchRegistry = (
  params: BatchRegistryQueryParams = {}
): Promise<PaginatedBatchRegistryListResponse> => {
  const queryString = buildQueryString(params);
  
  return getRequest<PaginatedBatchRegistryListResponse>(
    `${API_ENDPOINTS.BATCH_REGISTRY.ALL_RECORDS}${queryString}`,
    {
      policy: 'READ',
    }
  );
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

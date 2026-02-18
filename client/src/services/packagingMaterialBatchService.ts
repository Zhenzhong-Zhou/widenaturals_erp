import type {
  PackagingMaterialBatchQueryParams,
  PackagingMaterialBatchListApiResponse,
} from '@features/packagingMaterialBatch';
import {
  buildQueryString,
  flattenListQueryParams
} from '@utils/query';
import { getRequest } from '@utils/http';
import { API_ENDPOINTS } from '@services/apiEndpoints';

/**
 * Fetch a paginated list of packaging material batch records.
 *
 * Responsibilities:
 * - Serializes pagination, sorting, and filter parameters into a query string
 * - Flattens nested filter objects into backend-compatible query params
 * - Issues a READ-only HTTP request
 * - Preserves backend pagination metadata without transformation
 * - Returns a strongly typed paginated response
 *
 * Notes:
 * - Filters are provided via `params.filters`
 * - Date filters are flattened to top-level query parameters:
 *   - expiryAfter, expiryBefore
 *   - manufactureAfter, manufactureBefore
 *   - receivedAfter, receivedBefore
 *   - createdAfter, createdBefore
 * - Multi-select ID filters may be arrays or comma-separated values
 *
 * Guarantees:
 * - Stateless and side-effect free
 * - Safe for concurrent calls
 * - UI-agnostic
 *
 * @param params - Pagination, sorting, and filter options
 * @returns Paginated packaging material batch response
 * @throws {AppError} When request fails
 */
const fetchPaginatedPackagingMaterialBatches = async (
  params: PackagingMaterialBatchQueryParams = {}
): Promise<PackagingMaterialBatchListApiResponse> => {
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
  
  const url =
    `${API_ENDPOINTS.PACKAGING_MATERIAL_BATCHES.ALL_RECORDS}${queryString}`;
  
  return getRequest<PackagingMaterialBatchListApiResponse>(url, {
    policy: 'READ',
  });
};

/* =========================================================
 * Public API
 * ======================================================= */

/**
 * Packaging material batch service.
 *
 * Encapsulates all backend interactions related to
 * packaging material batch retrieval.
 */
export const packagingMaterialBatchService = {
  fetchPaginatedPackagingMaterialBatches,
};

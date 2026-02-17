import type {
  LocationTypeListQueryParams,
  PaginatedLocationTypeApiResponse,
} from '@features/locationType';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/http';
import { flattenListQueryParams } from '@utils/query/flattenListQueryParams';
import { buildQueryString } from '@utils/buildQueryString';
import { AppError } from '@utils/error';

/* =========================================================
 * Location Types Service
 * ======================================================= */

/**
 * Fetch a paginated list of location types.
 *
 * Responsibilities:
 * - Normalizes grouped list query parameters via `flattenListQueryParams`
 * - Serializes pagination, sorting, and filters into a query string
 * - Issues a READ-only HTTP request
 * - Performs defensive response validation
 *
 * Behavior:
 * - Filters are provided under `params.filters`
 * - Date range fields (createdAfter, createdBefore, updatedAfter, updatedBefore)
 *   are flattened into top-level query parameters
 * - No domain-to-UI transformation is performed
 * - Backend pagination metadata is preserved as-is
 *
 * Guarantees:
 * - Stateless and side-effect free
 * - Safe for concurrent calls
 * - UI-agnostic and reusable across thunks and loaders
 *
 * @param params - Pagination, sorting, and filter configuration
 * @returns Paginated location type API response
 * @throws {AppError} If response shape is invalid
 */
const fetchPaginatedLocationTypes = async (
  params: LocationTypeListQueryParams = {}
): Promise<PaginatedLocationTypeApiResponse> => {
  const flatParams = flattenListQueryParams(params);
  
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.LOCATION_TYPES.ALL_RECORDS}${queryString}`;
  
  const data = await getRequest<PaginatedLocationTypeApiResponse>(url, {
    policy: 'READ',
  });
  
  /**
   * Defensive validation
   */
  if (
    !data ||
    typeof data !== 'object' ||
    !Array.isArray(data.data) ||
    !data.pagination
  ) {
    throw AppError.server('Invalid paginated location types response', {
      params,
    });
  }
  
  return data;
};

/**
 * Structured service export.
 * Keeps feature boundary clean and explicit.
 */
export const locationTypeService = {
  fetchPaginatedLocationTypes,
};

import type {
  LocationListQueryParams,
  PaginatedLocationApiResponse,
} from '@features/location';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/http';
import { buildQueryString } from '@utils/buildQueryString';
import { AppError } from '@utils/error';

/* =========================================================
 * Locations
 * ======================================================= */

/**
 * Fetch a paginated list of locations.
 *
 * Responsibilities:
 * - Serializes pagination, sorting, and filter parameters into a query string
 * - Flattens nested filters into top-level query parameters
 * - Issues a READ-only HTTP request
 * - Preserves backend pagination metadata without transformation
 *
 * Notes:
 * - Filters are provided via `params.filters`
 * - Date range filters are flattened into:
 *     - createdFrom
 *     - createdTo
 * - Multi-select filters (statusIds) may be arrays or comma-separated values
 *
 * Guarantees:
 * - Stateless and side-effect free
 * - Safe for concurrent calls
 * - UI-agnostic and reusable across thunks and loaders
 *
 * @param params - Pagination, sorting, and location filter options
 * @returns Paginated location response
 * @throws {AppError}
 */
const fetchPaginatedLocations = async (
  params: LocationListQueryParams = {}
): Promise<PaginatedLocationApiResponse> => {
  const { filters = {}, ...rest } = params;

  const {
    createdAfter,
    createdBefore,
    updatedAfter,
    updatedBefore,
    ...otherFilters
  } = filters;

  /**
   * Flatten date filters → query params
   */
  const flatDateParams: Record<string, string> = {};

  if (createdAfter) flatDateParams.createdAfter = createdAfter;
  if (createdBefore) flatDateParams.createdBefore = createdBefore;
  if (updatedAfter) flatDateParams.updatedAfter = updatedAfter;
  if (updatedBefore) flatDateParams.updatedBefore = updatedBefore;

  /**
   * Final flattened params
   */
  const flatParams = {
    ...rest,
    ...otherFilters,
    ...flatDateParams,
  };

  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.LOCATIONS.ALL_RECORDS}${queryString}`;

  const data = await getRequest<PaginatedLocationApiResponse>(url, {
    policy: 'READ',
  });

  /**
   * Defensive validation
   */
  if (!data || typeof data !== 'object' || !Array.isArray(data.data)) {
    throw AppError.server('Invalid paginated locations response', {
      params,
    });
  }

  return data;
};

/**
 * Structured location service export.
 * Keeps feature boundary clean and explicit.
 */
export const locationService = {
  fetchPaginatedLocations,
};

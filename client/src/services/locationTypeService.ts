import type {
  GetLocationTypeDetailsApiResponse,
  LocationTypeListQueryParams,
  PaginatedLocationTypeApiResponse,
} from '@features/locationType';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/http';
import { flattenListQueryParams } from '@utils/query/flattenListQueryParams';
import { buildQueryString } from '@utils/query';
import { AppError } from '@utils/error';
import { sanitizeString } from '@utils/stringUtils';

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
 * Fetch full Location Type details by ID.
 *
 * ─────────────────────────────────────────────────────────────
 * Purpose
 * ─────────────────────────────────────────────────────────────
 * Retrieves the canonical LocationTypeDetails record
 * from the backend using a validated identifier.
 *
 * This function operates at the API service layer and:
 * - Performs input sanitization
 * - Issues a typed GET request
 * - Returns the raw, nested domain model
 *
 * ─────────────────────────────────────────────────────────────
 * Layer Responsibilities
 * ─────────────────────────────────────────────────────────────
 * ✔ API layer only
 * ✔ Does NOT perform UI transformation
 * ✔ Does NOT flatten data
 * ✔ Does NOT handle Redux logic
 *
 * Transformation into UI-ready structures must occur
 * in the transformer layer (e.g. flattenLocationTypeDetails).
 *
 * ─────────────────────────────────────────────────────────────
 * Security & Policy
 * ─────────────────────────────────────────────────────────────
 * - Enforces READ policy
 * - Sanitizes identifier prior to request execution
 * - Relies on centralized request wrapper for:
 *   • auth headers
 *   • CSRF handling
 *   • error normalization
 *
 * ─────────────────────────────────────────────────────────────
 * @param locationTypeId - UUID identifier of the Location Type
 *
 * @returns Promise resolving to:
 * ApiSuccessResponse<LocationTypeDetails>
 */
const fetchLocationTypeDetailsById = (
  locationTypeId: string
): Promise<GetLocationTypeDetailsApiResponse> => {
  const cleanId = sanitizeString(locationTypeId);
  
  return getRequest<GetLocationTypeDetailsApiResponse>(
    API_ENDPOINTS.LOCATION_TYPES.LOCATION_TYPE_DETAILS(cleanId),
    { policy: 'READ' }
  );
};

/**
 * Structured service export.
 * Keeps feature boundary clean and explicit.
 */
export const locationTypeService = {
  fetchPaginatedLocationTypes,
  fetchLocationTypeDetailsById,
};

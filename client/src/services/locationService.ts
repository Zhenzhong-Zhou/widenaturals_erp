import type { LocationResponse } from '@features/location';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/http';
import { AppError } from '@utils/error';

/* =========================================================
 * Locations
 * ======================================================= */

/**
 * Fetches paginated locations from the backend.
 *
 * Transport guarantees:
 * - GET request (idempotent, retryable)
 * - Centralized timeout + retry policy
 * - Errors normalized into `AppError`
 *
 * @param page - Current page number (1-based)
 * @param limit - Number of results per page
 * @returns Paginated location response
 *
 * @throws {AppError}
 */
const fetchAllLocations = async (
  page: number,
  limit: number
): Promise<LocationResponse> => {
  const data = await getRequest<LocationResponse>(
    API_ENDPOINTS.LOCATIONS.ALL_RECORDS,
    {
      policy: 'READ',
      config: {
        params: { page, limit },
      },
    }
  );
  
  // ----------------------------------
  // Defensive response validation
  // ----------------------------------
  if (!data || typeof data !== 'object') {
    throw AppError.server(
      'Invalid locations response',
      { page, limit }
    );
  }
  
  return data;
};

// Export the location service with structured API calls
export const locationService = {
  fetchAllLocations,
};

import type { HealthApiResponse } from '@features/systemHealth';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/http';
import { AppError } from '@utils/error';

/* =========================================================
 * Public Health (API Layer)
 * ======================================================= */

/**
 * Fetch the server's public health status.
 *
 * Public, unauthenticated, READ-only endpoint.
 * Used during application bootstrap and diagnostics.
 *
 * NOTE:
 * - Returns raw API data only
 * - Does NOT include UI state (loading / error)
 */
const fetchPublicHealthStatus = async (): Promise<HealthApiResponse> => {
  const data = await getRequest<HealthApiResponse>(
    API_ENDPOINTS.PUBLIC.HEALTH,
    { policy: 'READ' }
  );

  /**
   * Defensive validation is intentional here.
   *
   * This endpoint is infrastructure-critical and may be
   * consumed before the app is fully initialized.
   * A malformed response should fail fast.
   */
  if (!data || typeof data !== 'object') {
    throw AppError.server('Invalid public health status response', {
      response: data,
    });
  }

  return data;
};

/* =========================================================
 * Public API
 * ======================================================= */
export const systemHealthService = {
  fetchPublicHealthStatus,
};

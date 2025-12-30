import type { HealthState } from '@features/health/state';
import { getRequest } from '@utils/apiRequest';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { AppError } from '@utils/error/AppError.tsx';

/**
 * Fetches the public health status of the server.
 *
 * Issues:
 *   GET /public/health
 *
 * Characteristics:
 * - Public, unauthenticated endpoint
 * - Safe to retry (idempotent)
 * - Subject to centralized timeout, retry, and error normalization
 *
 * Intended usage:
 * - Application bootstrap checks
 * - Health monitoring / status pages
 * - Infrastructure diagnostics
 *
 * @returns A promise resolving to the server's public health state.
 *
 * @throws {AppError}
 * - `Server` error when the response shape is invalid
 * - Transport-level errors are normalized upstream by `getRequest`
 */
export const fetchPublicHealthStatus = async (): Promise<HealthState> => {
  const data = await getRequest<HealthState>(
    API_ENDPOINTS.PUBLIC.HEALTH
  );
  
  /* --------------------------------------------------------
   * Defensive shape validation
   *
   * This endpoint is infrastructure-critical. Even though
   * it is public, we validate defensively to avoid
   * cascading failures during app initialization.
   * ------------------------------------------------------ */
  if (!data || typeof data !== 'object') {
    throw AppError.server(
      'Invalid public health status response',
      {
        response: data,
      }
    );
  }
  
  return data;
};

/**
 * Public health status service.
 *
 * Encapsulates public, unauthenticated health-related reads.
 * Kept intentionally small and side-effect free.
 */
export const publicHealthStatusService = {
  fetchPublicHealthStatus,
};

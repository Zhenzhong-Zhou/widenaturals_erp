import { AsyncState } from '@shared-types/api';

/**
 * Health check API response.
 *
 * Represents the sanitized, public-facing system health snapshot
 * returned by the backend health endpoint.
 *
 * Notes:
 * - This type reflects the raw API contract
 * - UI-derived states such as `loading` are handled separately
 */
export interface HealthApiResponse {
  /**
   * Overall server health status.
   *
   * This value is computed server-side and reflects
   * the aggregated health of critical dependencies.
   */
  server: 'healthy' | 'unhealthy';
  
  /**
   * Health status of critical system services.
   */
  services: {
    database: ServiceStatus;
    pool: ServiceStatus;
  };
  
  /**
   * ISO 8601 timestamp representing when the health
   * snapshot was generated.
   */
  timestamp: string;
}

/**
 * Health status of an individual service.
 *
 * This reflects the service-level evaluation performed
 * by the backend at the time of the health check.
 */
export interface ServiceStatus {
  /**
   * Current health status of the service.
   */
  status: HealthStatus;
}

/**
 * Allowed domain-level health status values.
 *
 * Notes:
 * - API responses typically return `healthy` or `unhealthy`
 * - `unknown` is used by the frontend before a snapshot is available
 */
export type HealthStatus = 'healthy' | 'unhealthy' | 'unknown';

/**
 * Frontend UI state for system health.
 *
 * Wraps the API response with standardized async metadata
 * (loading, error, resolved data).
 */
export type HealthUiState = AsyncState<HealthApiResponse | null>;

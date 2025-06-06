import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { AppError, ErrorType } from '@utils/AppError';
import { withTimeout } from '@utils/timeoutUtils';
import { withRetry } from '@utils/retryUtils';
import { isCustomAxiosError } from '@utils/axiosUtils';
import type { HealthState } from '@features/health/state';

/**
 * Fetches the public health status of the server.
 *
 * @returns {Promise<HealthState>} The server's public health status response.
 * @throws {AppError} Throws an AppError for any issues during the request.
 */
const fetchPublicHealthStatus = async (): Promise<HealthState> => {
  try {
    const timeoutMessage =
      'Request timed out while fetching public health status';
    const retryMessage =
      'All retries failed while fetching public health status';

    const response = await withRetry(
      async () =>
        await withTimeout(
          axiosInstance.get<HealthState>(API_ENDPOINTS.PUBLIC_HEALTH),
          5000, // Timeout in milliseconds
          timeoutMessage // Timeout error message
        ),
      3, // Retry attempts
      1000, // Delay in milliseconds between retries
      retryMessage // Retry error message
    );

    if (!response || response.status !== 200) {
      throw new AppError('Unexpected response from server', 502, {
        type: ErrorType.NetworkError,
        details: `Response status: ${response?.status || 'unknown'}`,
      });
    }

    return response.data;
  } catch (error) {
    if (isCustomAxiosError(error)) {
      // Handle Axios-specific errors
      throw new AppError(
        'Failed to fetch public health status',
        error.response?.status || 500,
        {
          type: ErrorType.NetworkError,
          details: error.message,
        }
      );
    }

    // Re-throw unknown errors as AppError
    throw new AppError('Unexpected error occurred', 500, {
      type: ErrorType.UnknownError,
      details: error instanceof AppError ? error.message : 'Unknown error',
    });
  }
};

/**
 * Exports the public health status service.
 */
export const publicHealthStatusService = {
  fetchPublicHealthStatus,
};

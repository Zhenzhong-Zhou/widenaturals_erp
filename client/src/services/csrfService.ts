import { getRequest } from '@utils/http';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { AppError } from '@utils/error';

/**
 * Fetches a CSRF token from the backend.
 *
 * Issues:
 *   GET /csrf-token
 *
 * Characteristics:
 * - Public (cookie-based authentication)
 * - Read-only
 * - Safe to retry
 *
 * Notes:
 * - Network and HTTP errors are normalized by the transport layer.
 * - This function validates the response shape and enforces the
 *   presence of a CSRF token.
 *
 * @returns A promise resolving to the CSRF token string.
 * @throws {AppError} When the request fails or the response is invalid.
 */
const fetchCsrfToken = async (): Promise<string> => {
  const response = await getRequest<{ csrfToken: string }>(
    API_ENDPOINTS.SECURITY.CSRF.TOKEN,
    {
      config: { withCredentials: true },
    }
  );

  const token = response?.csrfToken;

  if (!token) {
    throw AppError.server('Invalid CSRF token response', {
      response,
    });
  }

  return token;
};

/**
 * CSRF service.
 */
export const csrfService = {
  fetchCsrfToken,
};

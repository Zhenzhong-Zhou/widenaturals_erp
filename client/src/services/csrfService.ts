import type { AppDispatch } from '@store/store';
import { getRequest } from '@utils/apiRequest';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { AppError } from '@utils/error/AppError.tsx';
import {
  resetCsrfToken,
  updateCsrfToken,
} from '@features/csrf/state/csrfSlice';

/**
 * Fetches a CSRF token from the backend.
 *
 * Issues:
 *   GET /csrf-token
 *
 * Characteristics:
 * - Public (cookie-based)
 * - Read-only
 * - Safe to retry
 *
 * @returns A promise resolving to the CSRF token string.
 *
 * @throws {AppError}
 * - Server error if response is malformed
 */
const fetchCsrfToken = async (): Promise<string> => {
  const data = await getRequest<{ csrfToken: string }>(
    API_ENDPOINTS.SECURITY.CSRF.TOKEN,
    {
      config: { withCredentials: true },
    }
  );
  
  const token = data?.csrfToken;
  
  if (!token) {
    throw AppError.server(
      'Invalid CSRF token response',
      { response: data }
    );
  }
  
  return token;
};

/**
 * Initializes CSRF token and synchronizes it into Redux state.
 *
 * Responsibilities:
 * - Fetch CSRF token via service
 * - Update Redux store
 * - Reset CSRF state on failure
 *
 * @param dispatch - Redux dispatch function
 *
 * @throws {AppError}
 * Propagates initialization failures to caller
 */
const initializeCsrfToken = async (
  dispatch: AppDispatch
): Promise<void> => {
  try {
    const csrfToken = await fetchCsrfToken();
    dispatch(updateCsrfToken(csrfToken));
  } catch (error) {
    // Defensive reset on persistent failure
    dispatch(resetCsrfToken());
    
    throw AppError.server(
      'CSRF initialization failed',
      error instanceof AppError
        ? { cause: error.message }
        : undefined
    );
  }
};

/**
 * CSRF service.
 */
export const csrfService = {
  fetchCsrfToken,
  initializeCsrfToken,
};

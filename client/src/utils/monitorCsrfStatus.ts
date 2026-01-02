import { AppError } from '@utils/error/AppError.tsx';

/* =========================================================
 * CSRF status monitor
 * ======================================================= */

/**
 * Observes CSRF lifecycle state and reacts to terminal outcomes.
 *
 * Responsibilities:
 * - Detect unrecoverable CSRF initialization failures
 * - Surface infrastructure-level errors early
 *
 * IMPORTANT:
 * - This function MUST NOT perform retries
 * - This function MUST NOT dispatch Redux actions
 * - Throwing here is intentional and should be handled
 *   by an error boundary or initialization guard
 *
 * @param status - Current CSRF lifecycle status
 * @param error  - Optional error message
 *
 * @throws {AppError}
 * When CSRF initialization fails
 */
export const monitorCsrfStatus = (
  status: 'idle' | 'loading' | 'succeeded' | 'failed',
  error?: string | null
): void => {
  if (status === 'failed') {
    throw AppError.server(
      'CSRF initialization failed',
      error ? { reason: error } : undefined
    );
  }

  if (status === 'succeeded') {
    // Non-intrusive confirmation only (no side effects)
    console.info('[CSRF] Token initialized successfully');
  }
};

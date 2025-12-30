import { AppError, ErrorType } from '@utils/error';

/* =========================================================
 * Transport retry predicate
 * ======================================================= */

/**
 * Determines whether a failed request is eligible for retry.
 *
 * Retries are allowed **only** for transient, transport-level failures:
 * - Network interruptions
 * - Timeouts
 * - Server-side failures (5xx)
 *
 * Retries are explicitly **disabled** for:
 * - Authentication / authorization errors
 * - Validation or business rule violations
 * - Rate limiting (handled via Retry-After elsewhere)
 *
 * @param error - Normalized application error
 * @returns `true` if the request may be retried; otherwise `false`
 */
export const defaultRetryPredicate = (error: unknown): boolean => {
  if (!(error instanceof AppError)) {
    return false;
  }
  
  switch (error.type) {
    case ErrorType.Network:
    case ErrorType.Timeout:
    case ErrorType.Server:
      return true;
    
    default:
      return false;
  }
};

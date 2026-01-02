import { AppError, ErrorSeverity } from '@utils/error/AppError.tsx';
import type { AxiosError } from 'axios';

/* =========================================================
 * Global Error Handling (logging / reporting)
 * ======================================================= */

/**
 * Centralized global error handler.
 *
 * Responsibilities:
 * - Logs normalized `AppError` instances and unexpected runtime errors
 * - Optionally forwards errors to an external monitoring service
 * - Acts as the final boundary for uncaught errors in the UI layer
 *
 * IMPORTANT:
 * - This function must NOT throw
 * - This function must NOT mutate the error
 * - Reporting behavior should remain environment-gated
 *
 * @param error - The error to handle
 * @param logCallback - Optional callback for custom logging (e.g. Sentry)
 */
export const handleError = (
  error: unknown,
  logCallback?: (error: AppError | Error) => void
): void => {
  const shouldReport = import.meta.env.MODE === 'production';

  // ----------------------------------
  // Normalized AppError
  // ----------------------------------
  if (error instanceof AppError) {
    console.error(
      `[AppError] type=${error.type} severity=${error.severity} status=${error.status}`,
      error.details
    );

    logCallback?.(error);

    if (shouldReport) {
      // Future: send AppError to backend or monitoring service
    }
    return;
  }

  // ----------------------------------
  // Native runtime error (unexpected)
  // ----------------------------------
  if (error instanceof Error) {
    console.error(
      `[Unhandled Error] ${error.name}: ${error.message}`,
      error.stack
    );

    logCallback?.(error);

    // Future: wrap and forward as AppError.unknown(...)
    if (shouldReport) {
      // const wrapped = AppError.unknown(error.message, error);
      // send wrapped error
    }
    return;
  }

  // ----------------------------------
  // Truly unknown thrown value
  // ----------------------------------
  console.error('[Unknown thrown value]', error);

  if (shouldReport) {
    // const wrapped = AppError.unknown('Unknown error thrown', error);
    // send wrapped error
  }
};

/* =========================================================
 * UI Message Mapping (human-readable)
 * ======================================================= */

/**
 * Maps any thrown value into a user-facing error message string.
 *
 * IMPORTANT:
 * - UI-layer ONLY
 * - Must NOT log or report errors
 * - Must NOT introduce business or transport logic
 *
 * @param error - The error to map
 * @returns A safe, human-readable message for display
 */
export const mapErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }

  if (isAxiosError(error)) {
    const apiMessage = (error.response?.data as any)?.message;
    if (typeof apiMessage === 'string') {
      return apiMessage;
    }
    return 'Network request failed. Please try again.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return defaultMessage();
};

/**
 * Centralized fallback message to keep UX consistent.
 */
const defaultMessage = () =>
  'An unexpected error occurred. Please try again or contact support.';

/* =========================================================
 * UI Severity Classification
 * ======================================================= */

/**
 * Categorizes an error into a coarse UI severity level.
 *
 * Intended for:
 * - Alert styling
 * - Toast severity
 * - Visual prioritization
 *
 * @param error - The error to categorize
 * @returns One of: 'critical' | 'warning' | 'info'
 */
export const categorizeError = (
  error: unknown
): 'critical' | 'warning' | 'info' => {
  if (error instanceof AppError) {
    switch (error.severity) {
      case ErrorSeverity.Critical:
        return 'critical';
      case ErrorSeverity.High:
        return 'warning';
      default:
        return 'info';
    }
  }

  if (isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    if (status >= 500) return 'critical';
    if (status >= 400) return 'warning';
  }

  return 'info';
};

/* =========================================================
 * Helpers
 * ======================================================= */

/**
 * Narrow Axios errors without leaking Axios types everywhere.
 */
const isAxiosError = (error: unknown): error is AxiosError =>
  Boolean(
    error && typeof error === 'object' && (error as any).isAxiosError === true
  );

/**
 * Converts error details into a string for logging or display.
 *
 * @param details - Error details (string or object)
 * @returns Stringified details or undefined
 */
export const getErrorLog = (
  details: string | Record<string, unknown> | undefined
): string | undefined => {
  if (!details) return undefined;
  return typeof details === 'string' ? details : JSON.stringify(details);
};

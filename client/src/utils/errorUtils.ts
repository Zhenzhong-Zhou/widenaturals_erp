import { AppError, ErrorType } from './AppError';
import { AxiosError } from 'axios';

/**
 * Handles and logs errors globally.
 * Can also send errors to external monitoring services.
 *
 * @param error - The error to handle.
 * @param logCallback - Optional callback for custom logging (e.g., Sentry).
 */
export const handleError = (
  error: unknown,
  logCallback?: (error: AppError | Error) => void
): void => {
  const shouldReportError = import.meta.env.MODE === 'production';

  if (error instanceof AppError) {
    console.error(
      `[AppError] Type: ${error.type}, Status: ${error.status}, Message: ${error.message}`
    );
    if (logCallback) logCallback(error);
    if (shouldReportError) AppError.reportError(error);
  } else if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0; // Default to 0 if undefined
    const details = {
      url: error.config?.url || 'Unknown URL',
      method: error.config?.method || 'Unknown Method',
      response: error.response?.data || {},
    };

    console.error(`[AxiosError] Status: ${status}, Message: ${error.message}`);
    if (logCallback) logCallback(error);

    if (shouldReportError && status >= 500) {
      const appError = new AppError('Network error occurred', status, {
        type: ErrorType.NetworkError,
        details,
      });
      AppError.reportError(appError);
    }
  } else if (error instanceof Error) {
    console.error(`[Error] Name: ${error.name}, Message: ${error.message}`);
    if (logCallback) logCallback(error);

    if (shouldReportError) {
      const appError = new AppError(error.message, 500, {
        type: ErrorType.UnknownError,
        details: {
          name: error.name,
          stack: error.stack,
        },
      });
      AppError.reportError(appError);
    }
  } else {
    console.error(`[Unknown Error]`, error);
    if (shouldReportError) {
      const appError = new AppError('Unknown error', 500, {
        type: ErrorType.UnknownError,
        details: { error },
      });
      AppError.reportError(appError);
    }
  }
};

/**
 * Maps an error to a user-friendly message.
 * Converts known error types into messages suitable for display.
 *
 * @param error - The error to map.
 * @returns A user-friendly error message.
 */
export const mapErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    // Check if details is an object and has a 'message' property
    if (
      typeof error.details === 'object' &&
      error.details !== null &&
      'message' in error.details
    ) {
      return (error.details as { message: string }).message;
    }
    return error.message || 'An error occurred. Please try again.';
  }
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 'unknown'; // Default to 'unknown' if undefined
    return (
      error.response?.data?.message || `Request failed with status ${status}`
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred. Please contact support.';
};

/**
 * Converts error details into a string for logging or display purposes.
 * If the details are already a string, it returns them as-is.
 * If the details are an object, it converts them to a JSON string.
 *
 * @param details - The error details to process.
 * @returns A stringified version of the details or undefined if details are not provided.
 */
export const getErrorLog = (
  details: string | Record<string, unknown> | undefined
): string | undefined => {
  if (!details) return undefined;
  return typeof details === 'string' ? details : JSON.stringify(details);
};

/**
 * Categorizes an error based on severity.
 *
 * @param error - The error to categorize.
 * @returns One of: 'critical', 'warning', 'info'.
 */
export const categorizeError = (
  error: unknown
): 'critical' | 'warning' | 'info' => {
  if (error instanceof AppError) {
    return error.type === ErrorType.SevereError || error.status >= 500
      ? 'critical'
      : 'warning';
  }
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0; // Default to 0 if undefined
    if (status >= 500) return 'critical';
    if (status === 404 || status === 400) return 'warning';
  }
  return 'info';
};

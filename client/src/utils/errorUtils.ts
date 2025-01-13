import AppError from './AppError';
import { AxiosError } from 'axios';

/**
 * Handles and logs errors globally.
 * Can also send errors to external monitoring services.
 *
 * @param error - The error to handle.
 * @param logCallback - Optional callback for custom logging (e.g., Sentry).
 */
export const handleError = (error: unknown, logCallback?: (error: Error) => void): void => {
  const shouldReportError = import.meta.env.MODE === 'production';
  
  if (error instanceof AppError) {
    console.error(`[AppError] Type: ${error.type}, Status: ${error.status}, Message: ${error.message}`);
    if (logCallback) logCallback(error);
    if (shouldReportError) AppError.reportError(error);
  } else if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0; // Default to 0 if undefined
    console.error(`[AxiosError] Status: ${status}, Message: ${error.message}`);
    if (logCallback) logCallback(error);
    if (shouldReportError && status >= 500) {
      AppError.reportError(new AppError(error.message, status, 'NetworkError'));
    }
  } else if (error instanceof Error) {
    console.error(`[Error] Name: ${error.name}, Message: ${error.message}`);
    if (logCallback) logCallback(error);
    if (shouldReportError) AppError.reportError(new AppError(error.message, 500, 'UnknownError'));
  } else {
    console.error(`[Unknown Error]`, error);
    if (shouldReportError) AppError.reportError(new AppError('Unknown error', 500, 'UnknownError'));
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
    return error.details || 'An error occurred. Please try again.';
  }
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 'unknown'; // Default to 'unknown' if undefined
    return error.response?.data?.message || `Request failed with status ${status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred. Please contact support.';
};

/**
 * Categorizes an error based on severity.
 *
 * @param error - The error to categorize.
 * @returns One of: 'critical', 'warning', 'info'.
 */
export const categorizeError = (error: unknown): 'critical' | 'warning' | 'info' => {
  if (error instanceof AppError) return 'critical';
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0; // Default to 0 if undefined
    if (status >= 500) return 'critical';
    if (status === 404) return 'warning';
  }
  return 'info';
};

import { AppError, ErrorType } from '@utils/error';

/**
 * Structured UI-safe error payload.
 *
 * Used by Redux thunks and UI components that require
 * both a user-facing message and a diagnostic reference
 * (e.g. admin lists, retry banners, support workflows).
 */
export interface UiErrorPayload {
  /**
   * User-facing error message.
   * Safe to display directly in the UI.
   */
  message: string;

  /** Error classification */
  type: ErrorType;

  /**
   * Optional diagnostic trace identifier.
   *
   * Used for log correlation and support/debug workflows.
   * This is intentionally UI-facing but non-sensitive.
   */
  traceId?: string;
}

/**
 * Extracts a structured, UI-safe error payload from an unknown error.
 *
 * Responsibilities:
 * - Preserves user-facing message
 * - Preserves diagnostic correlation ID when available
 * - Normalizes transport and runtime errors into a stable shape
 *
 * Usage:
 * - Redux thunks with `rejectValue: UiErrorPayload`
 * - Admin or observable UI flows
 *
 * This function is UI-facing only.
 * Must NOT be used in service, repository, or logging layers.
 */
export const extractUiErrorPayload = (error: unknown): UiErrorPayload => {
  if (error instanceof AppError) {
    return {
      message: error.message,
      type: error.type,
      traceId: error.correlationId,
    };
  }

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const resp = (error as any).response;

    return {
      message: resp?.data?.message ?? resp?.statusText ?? 'Request failed',
      type: ErrorType.Server,
      traceId: resp?.data?.traceId,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      type: ErrorType.Unknown,
    };
  }

  return {
    message: 'An unexpected error occurred. Please try again.',
    type: ErrorType.Unknown,
  };
};

/**
 * Extracts a user-facing error message from an unknown error value.
 *
 * Responsibilities:
 * - Produces a simple, display-ready message
 * - Intentionally discards diagnostic metadata
 *
 * Usage:
 * - Redux thunks with `rejectValue: string`
 * - Simple forms, dialogs, and detail views
 *
 * This function is intentionally lossy.
 * Do NOT use for admin, list, or observable UI flows.
 */
export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as any).response?.data?.message === 'string'
  ) {
    return (error as any).response.data.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

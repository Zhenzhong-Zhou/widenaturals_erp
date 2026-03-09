import { AppError, ErrorType } from '@utils/error';

/**
 * Structured UI-safe error payload.
 *
 * Represents a normalized error object returned by UI-facing layers
 * (e.g. Redux thunks, API hooks, or request interceptors).
 *
 * This structure intentionally contains only information that is safe
 * to expose to the UI and end users.
 *
 * Typical uses:
 * - Displaying validation errors in forms
 * - Rendering error dialogs or banners
 * - Showing retry notifications
 * - Supporting admin/debug workflows via trace identifiers
 *
 * This payload must only be used in UI layers.
 * Service, repository, and logging layers should use domain or system
 * error types instead.
 */
export interface UiErrorPayload {
  /**
   * Human-readable error message.
   *
   * Safe to display directly to users without exposing sensitive data.
   */
  message: string;

  /**
   * High-level classification of the error.
   *
   * Used to determine UI behavior such as:
   * - validation feedback
   * - authentication redirects
   * - retry prompts
   */
  type: ErrorType;

  /**
   * Optional domain-specific error code.
   *
   * Allows UI components to implement specialized behavior for
   * particular business errors (e.g. inventory allocation rules).
   *
   * Example values:
   * - `NO_WAREHOUSE_INVENTORY`
   * - `INSUFFICIENT_INVENTORY`
   * - `ORDER_STATUS_INVALID`
   */
  code?: string;

  /**
   * Optional structured error details.
   *
   * May contain additional context required by UI components,
   * such as validation fields or affected entities.
   *
   * Example:
   * - list of items that could not be allocated
   * - field validation metadata
   */
  details?: unknown;

  /**
   * Optional diagnostic trace identifier.
   *
   * Used for correlating UI errors with backend logs during
   * troubleshooting or support workflows.
   *
   * This value should never contain sensitive information.
   */
  traceId?: string;
}

/**
 * Extracts a normalized, UI-safe error payload from an unknown error value.
 *
 * This helper converts different runtime and transport error shapes
 * (e.g. AppError, Axios errors, or generic JS errors) into a stable
 * structure that can safely be consumed by UI components.
 *
 * Responsibilities:
 * - Preserves user-facing error messages
 * - Preserves domain error codes when available
 * - Preserves structured error details for UI rendering
 * - Preserves diagnostic trace identifiers for log correlation
 * - Normalizes transport/runtime errors into a consistent shape
 *
 * Typical usage:
 * - Redux Toolkit thunks using `rejectWithValue<UiErrorPayload>()`
 * - UI dialogs, banners, and retry flows
 * - Admin or observable UI error reporting
 *
 * Error handling behavior:
 * - `AppError` instances preserve full structured metadata
 *   (type, code, details, correlationId).
 * - Axios/transport errors attempt to extract structured payloads
 *   from `response.data`.
 * - Generic runtime errors are converted to `Unknown` errors.
 *
 * This function is strictly UI-facing.
 * It must NOT be used in service, repository, or logging layers,
 * where domain or system error types should be handled directly.
 */
export const extractUiErrorPayload = (error: unknown): UiErrorPayload => {
  if (error instanceof AppError) {
    return {
      message: error.message,
      type: error.type,
      code: error.code,
      details: error.details,
      traceId: error.correlationId,
    };
  }

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const resp = (error as any).response;

    return {
      message: resp?.data?.message ?? resp?.statusText ?? 'Request failed',
      type: ErrorType.Server,
      code: resp?.data?.code,
      details: resp?.data?.details,
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

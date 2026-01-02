/* =========================================================
 * Error domain public exports
 * ======================================================= */

/**
 * Core error model
 */
export { AppError, ErrorType, ErrorSeverity } from './AppError';

/**
 * Error normalization (transport → domain)
 */
export { mapHttpError } from './mapHttpError';

/**
 * Axios / transport guards
 */
export { isAxiosLikeError } from './isAxiosLikeError';

/**
 * UI-facing helpers
 */
export { extractErrorMessage, extractUiErrorPayload } from './uiErrorUtils';

/**
 * Global error handling & categorization
 */
export {
  handleError,
  mapErrorMessage,
  categorizeError,
  getErrorLog,
} from './errorUtils';

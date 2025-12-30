import { AppError } from '@utils/error/AppError.tsx';
import { isAxiosLikeError } from './isAxiosLikeError.ts';

/* =========================================================
 * HTTP → Domain Error Mapper
 * ======================================================= */

/**
 * Maps transport-level HTTP errors into normalized AppError instances.
 *
 * PURPOSE:
 * - Acts as a strict boundary between HTTP/transport concerns and domain logic
 * - Ensures downstream layers deal ONLY with AppError
 *
 * DESIGN RULES:
 * - Must NOT throw
 * - Must NOT log
 * - Must NOT perform side effects
 * - Always returns an AppError
 *
 * USAGE:
 * - Axios interceptors
 * - Service-layer catch blocks
 * - API boundary normalization
 *
 * @param error - Unknown error thrown by HTTP client
 * @returns Normalized AppError instance
 */
export const mapHttpError = (error: unknown): AppError => {
  if (isAxiosLikeError(error)) {
    const status = error.response?.status;
    
    switch (status) {
      case 401:
        return AppError.authentication();
      
      case 403:
        return AppError.authorization();
      
      case 404:
        return AppError.notFound();
      
      case 429:
        return AppError.rateLimit();
      
      default:
        if (status && status >= 500) {
          return AppError.server();
        }
    }
  }
  
  // Defensive fallback for non-HTTP or malformed errors
  return AppError.unknown(
    'Unexpected error occurred',
    error
  );
};

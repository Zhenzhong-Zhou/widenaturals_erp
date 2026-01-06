import type { AppDispatch } from '@store/store';
import { getCsrfTokenThunk } from '@features/csrf/state/csrfThunk';
import { AppError, ErrorType } from '@utils/error';

/**
 * Bootstraps CSRF protection for the application.
 *
 * Responsibilities:
 * - Fetch and store a CSRF token
 * - Surface *infrastructure-level* failures only
 *
 * MUST:
 * - Never resolve authentication state
 * - Never navigate
 * - Never perform hard logout
 * - Never swallow true server failures
 *
 * Auth resolution is handled separately by auth bootstrap
 * (e.g. permissions / /me endpoints).
 */
export const bootstrapCsrf = async (
  dispatch: AppDispatch
): Promise<void> => {
  try {
    await dispatch(getCsrfTokenThunk()).unwrap();
  } catch (error: unknown) {
    const appError =
      error instanceof AppError
        ? error
        : AppError.server('CSRF initialization failed', {
          cause:
            error instanceof Error ? error.message : String(error),
        });
    
    /**
     * CSRF failures are infrastructure failures.
     *
     * They may be caused by:
     * - backend outage
     * - misconfigured proxy
     * - invalid environment
     *
     * They MUST NOT:
     * - log the user out
     * - resolve auth state
     * - redirect
     *
     * Escalate only true server failures.
     */
    if (appError.type === ErrorType.Server) {
      throw appError;
    }
    
    /**
     * Non-server CSRF errors are recoverable
     * and should not break app bootstrap.
     */
  }
};

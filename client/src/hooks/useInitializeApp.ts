import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import { csrfService } from '@services/csrfService';
import { selectCsrfStatus, selectCsrfError } from '@features/csrf/state';
import { resetCsrfToken } from '@features/csrf/state/csrfSlice';
import { AppError } from '@utils/error';
import { monitorCsrfStatus } from '@utils/monitorCsrfStatus';
import { sleep } from '@utils/async';

interface InitializeAppOptions {
  /** Optional artificial delay (ms) for splash/loading UI */
  delayMs?: number;
}

/**
 * Performs one-time application bootstrap.
 *
 * Responsibilities:
 * - Initialize CSRF token
 * - Run optional app-level bootstrap logic
 * - Surface fatal initialization errors to AppContent
 *
 * MUST NOT:
 * - Refresh access tokens
 * - Mutate Axios headers
 * - Perform UI side effects
 */
const useInitializeApp = ({ delayMs = 0 }: InitializeAppOptions = {}) => {
  const dispatch = useAppDispatch();

  const csrfStatus = useAppSelector(selectCsrfStatus);
  const csrfError = useAppSelector(selectCsrfError);

  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] =
    useState<AppError | null>(null);

  // Prevent setState after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Step 1: Initialize CSRF token.
   * Transport retries / errors are handled centrally.
   */
  const initializeCsrfToken = useCallback(async () => {
    await csrfService.initializeCsrfToken(dispatch);
  }, [dispatch]);

  /**
   * Step 2: Optional app bootstrap logic.
   */
  const initializeAppCore = useCallback(async () => {
    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }, [delayMs]);

  useEffect(() => {
    const run = async () => {
      setIsInitializing(true);
      setInitializationError(null);

      try {
        await initializeCsrfToken();
        await initializeAppCore();
      } catch (error: unknown) {
        const appError =
          error instanceof AppError
            ? error
            : AppError.server('Error during application initialization', {
                originalError:
                  error instanceof Error ? error.message : String(error),
              });

        // Local recovery: reset CSRF state
        dispatch(resetCsrfToken());

        if (isMountedRef.current) {
          setInitializationError(appError);
        }
      } finally {
        if (isMountedRef.current) {
          setIsInitializing(false);
        }
      }
    };

    run().catch(() => {
      // Errors are handled inside `run`
    });
  }, [dispatch, initializeCsrfToken, initializeAppCore]);

  /**
   * Monitor CSRF state changes separately to avoid race conditions.
   */
  useEffect(() => {
    monitorCsrfStatus(csrfStatus, csrfError);
  }, [csrfStatus, csrfError]);

  return {
    isInitializing,
    hasError: Boolean(initializationError),
    initializationError,
  };
};

export default useInitializeApp;

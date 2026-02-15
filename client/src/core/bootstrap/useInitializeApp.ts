import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import { bootstrapCsrf } from '@core/bootstrap/bootstrapCsrf';
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
 * Performs one-time, non-blocking application bootstrap.
 *
 * Responsibilities:
 * - Initialize CSRF token required for mutating requests
 * - Execute optional application-level bootstrap tasks
 * - Detect and expose fatal initialization failures
 *
 * Characteristics:
 * - Runs asynchronously after first paint
 * - Does NOT block rendering or gate application readiness
 * - Exposes error state for consumption by a boundary component
 *
 * MUST NOT:
 * - Refresh access tokens or session state
 * - Mutate Axios headers directly
 * - Control UI rendering or loading states
 */
const useInitializeApp = ({ delayMs = 0 }: InitializeAppOptions = {}) => {
  const dispatch = useAppDispatch();

  const csrfStatus = useAppSelector(selectCsrfStatus);
  const csrfError = useAppSelector(selectCsrfError);

  const [initializationError, setInitializationError] =
    useState<AppError | null>(null);

  // Prevent state updates after unmount during async bootstrap
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
    await bootstrapCsrf(dispatch);
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
    let cancelled = false;

    const run = async () => {
      try {
        await initializeCsrfToken();
        await initializeAppCore();
      } catch (error) {
        const appError =
          error instanceof AppError && error.type === 'Server' ? error : null;

        dispatch(resetCsrfToken());

        if (!cancelled && appError) {
          setInitializationError(appError);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Monitor CSRF state changes separately to avoid race conditions.
   */
  useEffect(() => {
    monitorCsrfStatus(csrfStatus, csrfError);
  }, [csrfStatus, csrfError]);

  return {
    hasError: Boolean(initializationError),
    initializationError,
  };
};

export default useInitializeApp;

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectServerStatus,
  selectDatabaseStatus,
  selectPoolStatus,
  selectHealthTimestamp,
  selectIsServerHealthy,
  selectSystemHealthLoading,
  selectSystemHealthError,
  selectIsSystemHealthEmpty,
  fetchSystemHealthThunk,
} from '@features/systemHealth';

/**
 * Result shape returned by `useSystemHealth`.
 *
 * Provides a consolidated, UI-ready view of system health,
 * without leaking Redux or API implementation details.
 */
interface UseSystemHealthResult {
  serverStatus?: 'healthy' | 'unhealthy';
  isHealthy: boolean;
  databaseStatus?: string;
  poolStatus?: string;
  timestamp?: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * useSystemHealth
 *
 * Feature-level hook for consuming system health status.
 *
 * Responsibilities:
 * - Consume public selectors only
 * - Trigger initial health fetch when needed
 * - Expose a stable, UI-friendly API
 *
 * Notes:
 * - Does NOT expose raw Redux state
 * - Does NOT infer state from fake defaults
 * - Safe for dashboards, headers, bootstrap gates
 */
const useSystemHealth = (): UseSystemHealthResult => {
  const dispatch = useAppDispatch();

  const serverStatus = useAppSelector(selectServerStatus);
  const isHealthy = useAppSelector(selectIsServerHealthy);
  const databaseStatus = useAppSelector(selectDatabaseStatus);
  const poolStatus = useAppSelector(selectPoolStatus);
  const timestamp = useAppSelector(selectHealthTimestamp);

  const loading = useAppSelector(selectSystemHealthLoading);
  const error = useAppSelector(selectSystemHealthError);
  const isEmpty = useAppSelector(selectIsSystemHealthEmpty);

  /**
   * Fetches the latest system health snapshot.
   */
  const refresh = useCallback(async () => {
    try {
      await dispatch(fetchSystemHealthThunk()).unwrap();
    } catch {
      // Error is handled via Redux state; no action needed here
    }
  }, [dispatch]);

  // Fetch once on mount if no data exists
  useEffect(() => {
    if (isEmpty && !loading) {
      void refresh();
    }
  }, [isEmpty, loading, refresh]);

  return {
    serverStatus,
    isHealthy,
    databaseStatus,
    poolStatus,
    timestamp,
    loading,
    error,
    refresh,
  };
};

export default useSystemHealth;

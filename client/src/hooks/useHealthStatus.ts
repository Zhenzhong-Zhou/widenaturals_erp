import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import type { HealthState } from '@features/health/state';
import {
  selectHealthState,
  selectDatabaseStatus,
  selectPoolStatus,
  selectHealthTimestamp,
  selectIsServerHealthy,
  selectIsHealthLoading,
  selectHealthError,
  fetchHealthStatus,
} from '@features/health/state';

interface UseHealthStatusResult {
  healthStatus: HealthState | null;
  loading: boolean;
  isHealthy: boolean;
  databaseStatus: string;
  poolStatus: string;
  timestamp: string;
  error: string | null;
  refreshHealthStatus: () => Promise<void>;
}

const useHealthStatus = (): UseHealthStatusResult => {
  const dispatch = useAppDispatch();

  // Selectors
  const healthStatus = useAppSelector(selectHealthState);
  const isHealthy = useAppSelector(selectIsServerHealthy);
  const databaseStatus = useAppSelector(selectDatabaseStatus);
  const poolStatus = useAppSelector(selectPoolStatus);
  const timestamp = useAppSelector(selectHealthTimestamp);
  const loading = useAppSelector(selectIsHealthLoading);
  const error = useAppSelector(selectHealthError);

  // Fetch health status
  const fetchStatus = useCallback(async () => {
    try {
      await dispatch(fetchHealthStatus()).unwrap();
    } catch (err) {
      console.error('Failed to fetch health status:', err);
    }
  }, [dispatch]);

  // Automatically fetch health status on mount
  useEffect(() => {
    (async () => {
      await fetchStatus();
    })();
  }, [fetchStatus]);

  return {
    healthStatus,
    loading,
    isHealthy,
    databaseStatus,
    poolStatus,
    timestamp,
    error,
    refreshHealthStatus: fetchStatus,
  };
};

export default useHealthStatus;

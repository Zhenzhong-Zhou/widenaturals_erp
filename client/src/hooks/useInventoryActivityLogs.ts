import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectBaseInventoryLogs,
  selectBaseLogsError,
  selectBaseLogsLoading,
  selectPaginatedInventoryLogs,
  selectPaginatedLogsError,
  selectPaginatedLogsLoading,
  selectPaginatedLogsPagination,
} from '@features/report/state';
import {
  fetchBaseInventoryActivityLogsThunk,
  fetchPaginatedInventoryActivityLogsThunk,
} from '@features/report/state';
import type { InventoryActivityLogQueryParams } from '@features/report/state';

/**
 * Hook to get base (non-paginated) inventory activity logs and trigger fetch.
 */
export const useBaseInventoryActivityLogs = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectBaseInventoryLogs);
  const loading = useAppSelector(selectBaseLogsLoading);
  const error = useAppSelector(selectBaseLogsError);
  
  const fetchLogs = useCallback(() => {
    dispatch(fetchBaseInventoryActivityLogsThunk());
  }, [dispatch]);
  
  return { data, loading, error, fetchLogs };
};

/**
 * Hook to get paginated inventory activity logs and trigger fetch.
 */
export const usePaginatedInventoryActivityLogs = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectPaginatedInventoryLogs);
  const pagination = useAppSelector(selectPaginatedLogsPagination);
  const loading = useAppSelector(selectPaginatedLogsLoading);
  const error = useAppSelector(selectPaginatedLogsError);
  
  const fetchLogs = useCallback((params: InventoryActivityLogQueryParams) => {
    dispatch(fetchPaginatedInventoryActivityLogsThunk(params));
  }, [dispatch]);
  
  return { data, pagination, loading, error, fetchLogs };
};

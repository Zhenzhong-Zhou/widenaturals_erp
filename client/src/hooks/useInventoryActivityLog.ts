import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchInventoryActivityLogThunk,
  selectInventoryActivityLogData,
  selectInventoryActivityLogPagination,
  selectInventoryActivityLogLoading,
  selectInventoryActivityLogError,
  selectInventoryActivityLogTotalRecords,
  selectInventoryActivityLogIsEmpty,
} from '@features/warehouseInventory/state';
import type { InventoryActivityLogQueryParams } from '@features/warehouseInventory';
import { normalizePagination } from '@utils/pagination/normalizePagination';
import { resetInventoryActivityLog } from '@features/warehouseInventory/state/inventoryActivityLogSlice';

/**
 * Custom hook to access memoized inventory activity log state and actions.
 * Automatically tracks data, loading, error, pagination, and empty state.
 */
const useInventoryActivityLog = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectInventoryActivityLogData);
  const pagination = useAppSelector(selectInventoryActivityLogPagination);
  const loading = useAppSelector(selectInventoryActivityLogLoading);
  const error = useAppSelector(selectInventoryActivityLogError);
  const totalRecords = useAppSelector(selectInventoryActivityLogTotalRecords);
  const isEmpty = useAppSelector(selectInventoryActivityLogIsEmpty);
  
  /**
   * Fetch paginated activity log records.
   * Accepts warehouseId, pagination, sorting, and filter parameters.
   */
  const fetchActivityLog = useCallback(
    (params: InventoryActivityLogQueryParams) => {
      dispatch(fetchInventoryActivityLogThunk(params));
    },
    [dispatch]
  );
  
  /**
   * Reset activity log state back to initial empty paginated state.
   */
  const resetActivityLog = useCallback(() => {
    dispatch(resetInventoryActivityLog());
  }, [dispatch]);
  
  const pageInfo = useMemo(() => {
    const { page, limit } = normalizePagination(pagination);
    return { page, limit };
  }, [pagination]);
  
  return {
    data,
    pagination,
    loading,
    error,
    totalRecords,
    isEmpty,
    pageInfo,
    fetchActivityLog,
    resetActivityLog,
  };
};

export default useInventoryActivityLog;

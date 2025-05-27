import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectLocationInventoryError,
  selectLocationInventoryLoading,
  selectLocationInventoryPagination,
  selectLocationInventoryRecords,
} from '@features/locationInventory/state/locationInventorySelectors';
import type { PaginationParams } from '@shared-types/api';
import { fetchLocationInventoryRecordsThunk, type LocationInventoryFilters } from '@features/locationInventory/state';
import { useCallback } from 'react';

/**
 * Custom hook to access and fetch location inventory records with optional filters.
 *
 */
const useLocationInventory = () => {
  const dispatch = useAppDispatch();
  
  const records = useAppSelector(selectLocationInventoryRecords);
  const loading = useAppSelector(selectLocationInventoryLoading);
  const error = useAppSelector(selectLocationInventoryError);
  const pagination = useAppSelector(selectLocationInventoryPagination);
  
  /**
   * Fetches location inventory records.
   *
   * @param {PaginationParams} pagination - Pagination settings
   * @param {LocationInventoryFilters} filters - Filter options
   */
  const fetchRecords = useCallback((pagination: PaginationParams, filters: LocationInventoryFilters) => {
    dispatch(fetchLocationInventoryRecordsThunk({ pagination, filters }));
  }, [dispatch]);
  
  return {
    records,
    loading,
    error,
    pagination,
    fetchRecords,
  };
};

export default useLocationInventory;

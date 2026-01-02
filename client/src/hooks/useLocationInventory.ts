import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchLocationInventoryRecordsThunk,
  selectLocationInventoryError,
  selectLocationInventoryLoading,
  selectLocationInventoryPagination,
  selectLocationInventoryRecords,
} from '@features/locationInventory/state';
import type { LocationInventoryFilters } from '@features/locationInventory/state';
import type { PaginationParams, SortConfig } from '@shared-types/api';

/**
 * Custom hook to access and fetch location inventory records with optional filters and sorting.
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
   * @param {SortConfig} [sortConfig] - Optional sort configuration
   */
  const fetchRecords = useCallback(
    (
      pagination: PaginationParams,
      filters: LocationInventoryFilters,
      sortConfig?: SortConfig
    ) => {
      dispatch(
        fetchLocationInventoryRecordsThunk({ pagination, filters, sortConfig })
      );
    },
    [dispatch]
  );

  return {
    records,
    loading,
    error,
    pagination,
    fetchRecords,
  };
};

export default useLocationInventory;

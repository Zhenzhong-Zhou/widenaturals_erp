/**
 * @file usePaginatedWarehouses.ts
 *
 * React hook for accessing paginated warehouse list state and actions.
 */

import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectPaginatedWarehousesData,
  selectPaginatedWarehousesPagination,
  selectPaginatedWarehousesLoading,
  selectPaginatedWarehousesError,
  selectPaginatedWarehousesTotalRecords,
  selectPaginatedWarehousesIsEmpty,
  fetchPaginatedWarehousesThunk,
} from '@features/warehouse';
import type { WarehouseQueryParams } from '@features/warehouse/state/warehouseTypes';
import {
  resetPaginatedWarehouses,
} from '@features/warehouse/state/paginatedWarehouseSlice';
import { normalizePagination } from '@utils/pagination/normalizePagination';

/**
 * React hook that provides access to paginated warehouse list state and actions.
 *
 * Exposes:
 * - Warehouse list data
 * - Loading & error state
 * - Pagination metadata
 * - Total record count
 * - Empty state indicator
 * - Actions to fetch or reset the warehouse list
 *
 * This hook should be used by all warehouse list pages and list-based components.
 */
const usePaginatedWarehouses = () => {
  const dispatch = useAppDispatch();
  
  // ---------------------------
  // Selectors
  // ---------------------------
  const data         = useAppSelector(selectPaginatedWarehousesData);
  const pagination   = useAppSelector(selectPaginatedWarehousesPagination);
  const loading      = useAppSelector(selectPaginatedWarehousesLoading);
  const error        = useAppSelector(selectPaginatedWarehousesError);
  const totalRecords = useAppSelector(selectPaginatedWarehousesTotalRecords);
  const isEmpty      = useAppSelector(selectPaginatedWarehousesIsEmpty);
  
  // ---------------------------
  // Actions
  // ---------------------------
  
  /**
   * Fetch paginated warehouse records.
   * Accepts pagination, sorting, and filter parameters.
   */
  const fetchWarehouses = useCallback(
    (params: WarehouseQueryParams) => {
      dispatch(fetchPaginatedWarehousesThunk(params));
    },
    [dispatch]
  );
  
  /**
   * Reset warehouse list state back to initial empty paginated state.
   */
  const resetWarehouses = useCallback(() => {
    dispatch(resetPaginatedWarehouses());
  }, [dispatch]);
  
  // ---------------------------
  // Derived memoized values
  // ---------------------------
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
    fetchWarehouses,
    resetWarehouses,
  };
};

export default usePaginatedWarehouses;

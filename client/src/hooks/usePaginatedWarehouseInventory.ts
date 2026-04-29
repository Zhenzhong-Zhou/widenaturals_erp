import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPaginatedWarehouseInventoryThunk,
  selectPaginatedWarehouseInventoryData,
  selectPaginatedWarehouseInventoryPagination,
  selectPaginatedWarehouseInventoryLoading,
  selectPaginatedWarehouseInventoryError,
  selectPaginatedWarehouseInventoryTotalRecords,
  selectPaginatedWarehouseInventoryIsEmpty,
} from '@features/warehouseInventory/state';
import type { WarehouseInventoryQueryParams } from '@features/warehouseInventory';
import { resetPaginatedWarehouseInventory } from '@features/warehouseInventory/state/paginatedWarehouseInventorySlice';
import { normalizePagination } from '@utils/pagination/normalizePagination';

/**
 * React hook that provides access to paginated warehouse inventory list state and actions.
 *
 * Exposes:
 * - Warehouse inventory list data
 * - Loading & error state
 * - Pagination metadata
 * - Total record count
 * - Empty state indicator
 * - Actions to fetch or reset warehouse inventory list
 *
 * This hook should be used by all warehouse inventory list pages and list-based components.
 */
const usePaginatedWarehouseInventory = () => {
  const dispatch = useAppDispatch();
  
  // ---------------------------
  // Selectors
  // ---------------------------
  const data         = useAppSelector(selectPaginatedWarehouseInventoryData);
  const pagination   = useAppSelector(selectPaginatedWarehouseInventoryPagination);
  const loading      = useAppSelector(selectPaginatedWarehouseInventoryLoading);
  const error        = useAppSelector(selectPaginatedWarehouseInventoryError);
  const totalRecords = useAppSelector(selectPaginatedWarehouseInventoryTotalRecords);
  const isEmpty      = useAppSelector(selectPaginatedWarehouseInventoryIsEmpty);
  
  // ---------------------------
  // Actions
  // ---------------------------
  /**
   * Fetch paginated warehouse inventory records.
   * Accepts warehouseId, pagination, sorting, and filter parameters.
   */
  const fetchWarehouseInventory = useCallback(
    (params: WarehouseInventoryQueryParams) => {
      dispatch(fetchPaginatedWarehouseInventoryThunk(params));
    },
    [dispatch]
  );
  
  /**
   * Reset warehouse inventory list state back to initial empty paginated state.
   */
  const resetWarehouseInventory = useCallback(() => {
    dispatch(resetPaginatedWarehouseInventory());
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
    
    fetchWarehouseInventory,
    resetWarehouseInventory,
  };
};

export default usePaginatedWarehouseInventory;

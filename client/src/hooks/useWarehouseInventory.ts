import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchWarehouseInventoryRecordsThunk,
  selectWarehouseInventoryError,
  selectWarehouseInventoryLoading,
  selectWarehouseInventoryPagination,
  selectWarehouseInventoryRecords,
  type WarehouseInventoryFilters,
} from '@features/warehouseInventory/state';
import type { PaginationParams, SortConfig } from '@shared-types/api';

const useWarehouseInventory = () => {
  const dispatch = useAppDispatch();

  const data = useAppSelector(selectWarehouseInventoryRecords);
  const loading = useAppSelector(selectWarehouseInventoryLoading);
  const error = useAppSelector(selectWarehouseInventoryError);
  const pagination = useAppSelector(selectWarehouseInventoryPagination);

  const records = useMemo(() => data, [data]);

  const fetchRecords = (
    paginationParams: PaginationParams,
    filters: WarehouseInventoryFilters,
    sortConfig: SortConfig = {}
  ) => {
    dispatch(
      fetchWarehouseInventoryRecordsThunk({
        pagination: paginationParams,
        filters,
        sortConfig,
      })
    );
  };

  return {
    records,
    loading,
    error,
    pagination,
    fetchRecords, // exposed fetch function
  };
};

export default useWarehouseInventory;

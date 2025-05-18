import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks.ts';
import {
  selectTotalAvailableQuantity,
  selectWarehouseInventoryItemSummaryError,
  selectWarehouseInventoryItemSummaryData,
  selectWarehouseInventoryItemSummaryLoading,
  selectWarehouseInventoryItemSummaryPagination
} from '@features/warehouseInventory/state';
import { fetchWarehouseInventoryItemSummaryThunk } from '@features/warehouseInventory/state/warehouseInventoryThunks';

/**
 * Custom hook to manage warehouse inventory summary state and trigger fetching logic.
 *
 * @param {object} options
 * @param {boolean} [options.autoFetch=true] - Whether to fetch data automatically on mount.
 * @param {'product' | 'packing_material' | 'all'} [options.itemType='all'] - Optional item type filter.
 */
const useWarehouseInventoryItemSummary = ({
                                            autoFetch = true,
                                            itemType = 'all',
                                          }: {
  autoFetch?: boolean;
  itemType?: 'product' | 'packing_material' | 'all';
} = {}) => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectWarehouseInventoryItemSummaryData);
  const pagination = useAppSelector(selectWarehouseInventoryItemSummaryPagination);
  const loading = useAppSelector(selectWarehouseInventoryItemSummaryLoading);
  const error = useAppSelector(selectWarehouseInventoryItemSummaryError);
  const totalAvailableQuantity = useAppSelector(selectTotalAvailableQuantity);
  
  const fetchWarehouseInventorySummary = (opts?: { page?: number; limit?: number, itemType: string }) => {
    dispatch(
      fetchWarehouseInventoryItemSummaryThunk({
        page: opts?.page ?? pagination?.page ?? 1,
        limit: opts?.limit ?? pagination?.limit ?? 50,
        itemType,
      })
    );
  };
  
  useEffect(() => {
    if (!autoFetch || loading) return;
    
    dispatch(
      fetchWarehouseInventoryItemSummaryThunk({
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 50,
        itemType,
      })
    );
  }, [autoFetch, itemType]);
  
  return {
    data,
    pagination,
    loading,
    error,
    totalAvailableQuantity,
    fetchWarehouseInventorySummary,
  };
};

export default useWarehouseInventoryItemSummary;

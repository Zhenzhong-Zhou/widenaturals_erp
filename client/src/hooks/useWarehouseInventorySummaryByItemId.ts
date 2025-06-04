import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectWarehouseInventorySummaryItemDetailsData,
  selectWarehouseInventorySummaryItemDetailsError,
  selectWarehouseInventorySummaryItemDetailsLoading,
  selectWarehouseInventorySummaryItemDetailsPagination,
} from '@features/warehouseInventory/state/warehouseInventorySummaryDetailSelectors';
import { fetchWarehouseInventorySummaryByItemIdThunk } from '@features/warehouseInventory/state/warehouseInventoryThunks';
import type { InventorySummaryDetailByItemIdParams } from '@features/inventoryShared/types/InventorySharedType';

/**
 * Custom hook to access warehouse inventory summary state and fetch function.
 *
 */
const useWarehouseInventorySummaryByItemId = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectWarehouseInventorySummaryItemDetailsData);
  const pagination = useAppSelector(selectWarehouseInventorySummaryItemDetailsPagination);
  const loading = useAppSelector(selectWarehouseInventorySummaryItemDetailsLoading);
  const error = useAppSelector(selectWarehouseInventorySummaryItemDetailsError);
  
  /**
   * Fetch warehouse inventory summary detail by item ID.
   *
   * @param {InventorySummaryDetailByItemIdParams} params - itemId, page, and limit
   */
  const fetchWarehouseInventorySummaryDetails = useCallback(
    (params: InventorySummaryDetailByItemIdParams) => {
      dispatch(fetchWarehouseInventorySummaryByItemIdThunk(params));
    },
    [dispatch]
  );
  
  return useMemo(
    () => ({
      data,
      pagination,
      loading,
      error,
      fetchWarehouseInventorySummaryDetails,
    }),
    [data, pagination, loading, error, fetchWarehouseInventorySummaryDetails]
  );
};

export default useWarehouseInventorySummaryByItemId;

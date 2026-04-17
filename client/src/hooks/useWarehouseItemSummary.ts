import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectWarehouseItemSummaryData,
  selectWarehouseItemSummaryLoading,
  selectWarehouseItemSummaryError,
  selectWarehouseItemSummaryProducts,
  selectWarehouseItemSummaryPackaging,
  selectWarehouseItemSummaryIsEmpty,
  fetchWarehouseItemSummaryThunk,
} from '@features/warehouseInventory/state';
import type { WarehouseItemSummaryQueryParams } from '@features/warehouseInventory';
import { resetWarehouseItemSummary } from '@features/warehouseInventory/state/warehouseItemSummarySlice';

/**
 * Custom hook to access memoized warehouse item summary state and actions.
 * Provides product and packaging material level inventory breakdowns.
 */
const useWarehouseItemSummary = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectWarehouseItemSummaryData);
  const loading = useAppSelector(selectWarehouseItemSummaryLoading);
  const error = useAppSelector(selectWarehouseItemSummaryError);
  const products = useAppSelector(selectWarehouseItemSummaryProducts);
  const packagingMaterials = useAppSelector(selectWarehouseItemSummaryPackaging);
  const isEmpty = useAppSelector(selectWarehouseItemSummaryIsEmpty);
  
  /**
   * Fetch the item-level summary for a warehouse.
   * @param params - warehouseId and optional batch type filter.
   */
  const fetchItemSummary = useCallback(
    (params: WarehouseItemSummaryQueryParams) => {
      dispatch(fetchWarehouseItemSummaryThunk(params));
    },
    [dispatch]
  );
  
  /**
   * Reset the item summary state to initial.
   */
  const resetItemSummary = useCallback(() => {
    dispatch(resetWarehouseItemSummary());
  }, [dispatch]);
  
  return {
    data,
    loading,
    error,
    products,
    packagingMaterials,
    isEmpty,
    fetchItemSummary,
    resetItemSummary,
  };
};

export default useWarehouseItemSummary;

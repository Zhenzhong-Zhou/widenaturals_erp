import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type FetchWarehouseItemSummaryParams,
  fetchWarehouseItemSummaryThunk,
  resetWarehouseItemSummary,
  selectWarehouseItemError,
  selectWarehouseItemLoading,
  selectWarehouseItemPagination,
  selectWarehouseItemSummary,
} from '@features/warehouse-inventory';

const useWarehouseItemSummary = (
  warehouseId: string,
  initialPage: number = 1,
  initialLimit: number = 10
) => {
  const dispatch = useAppDispatch();
  
  // Local pagination state
  const [itemSummaryPage, setItemSummaryPage] = useState<number>(initialPage);
  const [itemSummaryLimit, setItemSummaryLimit] =
    useState<number>(initialLimit);
  
  // Redux state
  const itemSummary = useAppSelector(selectWarehouseItemSummary);
  const itemSummaryPagination = useAppSelector(selectWarehouseItemPagination);
  const itemSummaryLoading = useAppSelector(selectWarehouseItemLoading);
  const itemSummaryError = useAppSelector(selectWarehouseItemError);
  
  // Fetch data when warehouseId, page, or limit changes
  useEffect(() => {
    if (warehouseId) {
      const params: FetchWarehouseItemSummaryParams = {
        warehouseId,
        itemSummaryPage,
        itemSummaryLimit,
      };
      dispatch(fetchWarehouseItemSummaryThunk(params));
    }
  }, [dispatch, warehouseId, itemSummaryPage, itemSummaryLimit]);
  
  // Manual refresh function
  const refreshItemSummary = useMemo(
    () => () => {
      const params: FetchWarehouseItemSummaryParams = {
        warehouseId,
        itemSummaryPage,
        itemSummaryLimit,
      };
      dispatch(fetchWarehouseItemSummaryThunk(params));
    },
    [dispatch, warehouseId, itemSummaryPage, itemSummaryLimit]
  );
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetWarehouseItemSummary());
    };
  }, [dispatch]);
  
  return useMemo(
    () => ({
      itemSummary,
      itemSummaryPagination,
      itemSummaryLoading,
      itemSummaryError,
      itemSummaryPage,
      itemSummaryLimit,
      setItemSummaryPage,
      setItemSummaryLimit,
      refreshItemSummary,
    }),
    [
      itemSummary,
      itemSummaryPagination,
      itemSummaryLoading,
      itemSummaryError,
      itemSummaryPage,
      itemSummaryLimit,
      refreshItemSummary,
    ]
  );
};

export default useWarehouseItemSummary;

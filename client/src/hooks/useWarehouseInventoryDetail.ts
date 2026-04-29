import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectWarehouseInventoryDetailData,
  selectWarehouseInventoryDetailLoading,
  selectWarehouseInventoryDetailError,
  selectWarehouseInventoryDetailProductInfo,
  selectWarehouseInventoryDetailPackagingInfo,
  selectWarehouseInventoryDetailZones,
  selectWarehouseInventoryDetailMovements,
  selectWarehouseInventoryDetailAudit,
  fetchWarehouseInventoryDetailThunk,
} from '@features/warehouseInventory/state';
import { resetWarehouseInventoryDetail } from '@features/warehouseInventory/state/warehouseInventoryDetailSlice';

/**
 * Custom hook to access memoized warehouse inventory detail state.
 * Automatically tracks loading, error, and all detail sub-sections.
 */
const useWarehouseInventoryDetail = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectWarehouseInventoryDetailData);
  const loading = useAppSelector(selectWarehouseInventoryDetailLoading);
  const error = useAppSelector(selectWarehouseInventoryDetailError);
  const productInfo = useAppSelector(selectWarehouseInventoryDetailProductInfo);
  const packagingInfo = useAppSelector(selectWarehouseInventoryDetailPackagingInfo);
  const zones = useAppSelector(selectWarehouseInventoryDetailZones);
  const movements = useAppSelector(selectWarehouseInventoryDetailMovements);
  const audit = useAppSelector(selectWarehouseInventoryDetailAudit);
  
  /**
   * Dispatches the thunk to fetch a single inventory record's detail.
   * @param warehouseId - Target warehouse UUID.
   * @param inventoryId - Target inventory record UUID.
   */
  const fetchDetail = useCallback(
    (warehouseId: string, inventoryId: string) => {
      dispatch(fetchWarehouseInventoryDetailThunk({ warehouseId, inventoryId }));
    },
    [dispatch]
  );
  
  /**
   * Resets the detail state to initial.
   */
  const resetDetail = useCallback(() => {
    dispatch(resetWarehouseInventoryDetail());
  }, [dispatch]);
  
  return {
    data,
    loading,
    error,
    productInfo,
    packagingInfo,
    zones,
    movements,
    audit,
    fetchDetail,
    resetDetail,
  };
};

export default useWarehouseInventoryDetail;

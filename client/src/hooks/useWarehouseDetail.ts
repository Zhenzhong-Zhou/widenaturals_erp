/**
 * @file useWarehouseDetail.ts
 *
 * React hook for accessing warehouse detail state and actions.
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectWarehouseDetailData,
  selectWarehouseDetailLoading,
  selectWarehouseDetailError,
  selectWarehouseDetailLocation,
  selectWarehouseDetailSummary,
  selectWarehouseDetailAudit,
} from '@features/warehouse/state/warehouseDetailSelectors';
import {
  resetWarehouseDetail,
} from '@features/warehouse/state/warehouseDetailSlice';
import { fetchWarehouseByIdThunk } from '@features/warehouse';

/**
 * Custom hook to access warehouse detail state and dispatch detail actions.
 * Automatically tracks loading, error, and all detail sub-sections.
 */
const useWarehouseDetail = () => {
  const dispatch = useAppDispatch();
  
  const data     = useAppSelector(selectWarehouseDetailData);
  const loading  = useAppSelector(selectWarehouseDetailLoading);
  const error    = useAppSelector(selectWarehouseDetailError);
  const location = useAppSelector(selectWarehouseDetailLocation);
  const summary  = useAppSelector(selectWarehouseDetailSummary);
  const audit    = useAppSelector(selectWarehouseDetailAudit);
  
  /**
   * Dispatches the thunk to fetch a single warehouse detail record.
   * @param warehouseId - Target warehouse UUID.
   */
  const fetchWarehouse = useCallback(
    (warehouseId: string) => {
      dispatch(fetchWarehouseByIdThunk(warehouseId));
    },
    [dispatch]
  );
  
  /**
   * Resets the warehouse detail state to initial.
   */
  const resetWarehouse = useCallback(() => {
    dispatch(resetWarehouseDetail());
  }, [dispatch]);
  
  return {
    data,
    loading,
    error,
    location,
    summary,
    audit,
    fetchWarehouse,
    resetWarehouse,
  };
};

export default useWarehouseDetail;

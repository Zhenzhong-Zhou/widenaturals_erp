import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectKpiSummaryData,
  selectKpiSummaryLoading,
  selectKpiSummaryError,
  selectKpiSummaryTotalRow,
  selectKpiSummaryProductRow,
  selectKpiSummaryMaterialRow,
} from '@features/locationInventory/state/locationInventoryKpiSummarySelectors';
import { fetchLocationInventoryKpiSummaryThunk } from '@features/locationInventory/state';
import type { ItemType } from '@features/inventoryShared/types/InventorySharedType';

/**
 * Custom hook to access and fetch KPI summary data for location inventory.
 *
 * @returns KPI summary data, loading state, error, individual rows for product/material/total, and a fetch function.
 */
const useLocationInventoryKpiSummary = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectKpiSummaryData);
  const loading = useAppSelector(selectKpiSummaryLoading);
  const error = useAppSelector(selectKpiSummaryError);
  const total = useAppSelector(selectKpiSummaryTotalRow);
  const product = useAppSelector(selectKpiSummaryProductRow);
  const material = useAppSelector(selectKpiSummaryMaterialRow);
  
  /**
   * Fetches KPI summary from the server.
   *
   * @param itemType Optional filter by item type ('product' or 'packaging_material')
   */
  const fetchKpiSummary = (itemType?: ItemType) => {
    dispatch(fetchLocationInventoryKpiSummaryThunk(itemType));
  };
  
  return {
    data,
    loading,
    error,
    total,
    product,
    material,
    fetchKpiSummary,
  };
};

export default useLocationInventoryKpiSummary;

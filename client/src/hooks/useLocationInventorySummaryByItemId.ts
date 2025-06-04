import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import { selectLocationInventorySummaryDetailData,
  selectLocationInventorySummaryDetailError,
  selectLocationInventorySummaryDetailLoading,
  selectLocationInventorySummaryDetailPagination,
  fetchLocationInventorySummaryByItemIdThunk
} from '@features/locationInventory/state';
import type { InventorySummaryDetailByItemIdParams } from '@features/inventoryShared/types/InventorySharedType';

/**
 * Custom hook to access and fetch location inventory summary detail by item ID.
 *
 */
const useLocationInventorySummary = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectLocationInventorySummaryDetailData);
  const pagination = useAppSelector(selectLocationInventorySummaryDetailPagination);
  const loading = useAppSelector(selectLocationInventorySummaryDetailLoading);
  const error = useAppSelector(selectLocationInventorySummaryDetailError);
  
  /**
   * Dispatches the thunk to fetch location inventory summary by item ID.
   *
   * @param {InventorySummaryDetailByItemIdParams} params - The item ID and optional pagination.
   */
  const fetchLocationInventorySummaryDetail = (params: InventorySummaryDetailByItemIdParams) => {
    dispatch(fetchLocationInventorySummaryByItemIdThunk(params));
  };
  
  return {
    data,
    pagination,
    loading,
    error,
    fetchLocationInventorySummaryDetail,
  };
};

export default useLocationInventorySummary;

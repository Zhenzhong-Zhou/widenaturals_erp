import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchInventorySummaryThunk,
  selectInventorySummaryData,
  selectInventorySummaryError,
  selectInventorySummaryLoading,
  selectInventorySummaryPagination,
} from '@features/inventory';

/**
 * Custom hook to interact with inventory summary state and actions.
 */
const useInventorySummary = () => {
  const dispatch = useAppDispatch();

  const inventorySummaryData = useAppSelector(selectInventorySummaryData);
  const inventorySummaryPagination = useAppSelector(
    selectInventorySummaryPagination
  );
  const inventorySummaryLoading = useAppSelector(selectInventorySummaryLoading);
  const inventorySummaryError = useAppSelector(selectInventorySummaryError);

  /**
   * Fetch inventory summary with pagination.
   * @param page Current page
   * @param limit Number of items per page
   */
  const fetchSummary = (page: number = 1, limit: number = 10) => {
    dispatch(fetchInventorySummaryThunk({ page, limit }));
  };

  /**
   * Refresh current inventory summary with the latest page/limit.
   */
  const refreshSummary = () => {
    dispatch(
      fetchInventorySummaryThunk({
        page: inventorySummaryPagination.page,
        limit: inventorySummaryPagination.limit,
      })
    );
  };

  return {
    inventorySummaryData,
    inventorySummaryPagination,
    inventorySummaryLoading,
    inventorySummaryError,
    fetchSummary,
    refreshSummary,
  };
};

export default useInventorySummary;

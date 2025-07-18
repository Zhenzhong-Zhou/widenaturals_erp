import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type FetchPaginatedOrderTypesParams,
  selectOrderTypeList,
  selectOrderTypePagination,
  selectOrderTypesError,
  selectOrderTypesLoading,
} from '@features/orderType/state';
import { fetchPaginatedOrderTypesThunk } from '@features/orderType/state/orderTypeThunks';
import { resetOrderTypesState } from '@features/orderType/state/paginatedOrderTypesSlice';

/**
 * Hook to access paginated order types data and utilities.
 *
 * @returns Object containing:
 *   - `data`: List of fetched order type records
 *   - `pagination`: Pagination state (page, limit, totalRecords, totalPages)
 *   - `loading`: Whether data is currently being fetched
 *   - `error`: Error message, if any
 *   - `fetchData`: Function to trigger fetch with params
 *   - `reset`: Function to reset state to initial
 */
const usePaginateOrderTypes = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectOrderTypeList);
  const pagination = useAppSelector(selectOrderTypePagination);
  const loading = useAppSelector(selectOrderTypesLoading);
  const error = useAppSelector(selectOrderTypesError);
  
  const fetchData = useCallback(
    (params: FetchPaginatedOrderTypesParams) => {
      dispatch(fetchPaginatedOrderTypesThunk(params));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetOrderTypesState());
  }, [dispatch]);
  
  return useMemo(
    () => ({
      data,
      pagination,
      loading,
      error,
      fetchData,
      reset,
    }),
    [data, pagination, loading, error, fetchData, reset]
  );
};

export default usePaginateOrderTypes;

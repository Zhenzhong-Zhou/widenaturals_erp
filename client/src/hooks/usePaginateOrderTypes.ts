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

/**
 * Hook to manage and fetch paginated order types with sorting and optional refresh.
 *
 * @param page - Current page number (starting from 1)
 * @param limit - Number of records per page
 * @param sortBy - Field to sort by (default: 'name')
 * @param sortOrder - Sort direction: 'ASC' or 'DESC' (default: 'ASC')
 *
 * @returns Object containing:
 *   - `orderTypes`: List of fetched order type records
 *   - `pagination`: Pagination state (page, limit, totalRecords, totalPages)
 *   - `isLoading`: Whether data is currently being fetched
 *   - `error`: Error message, if any
 *   - `refresh`: Function to manually re-trigger data fetch
 */
const usePaginateOrderTypes = (
  page: number,
  limit: number,
  sortBy: string = 'name',
  sortOrder: 'ASC' | 'DESC' = 'ASC'
) => {
  const dispatch = useAppDispatch();
  
  const orderTypes = useAppSelector(selectOrderTypeList);
  const pagination = useAppSelector(selectOrderTypePagination);
  const isLoading = useAppSelector(selectOrderTypesLoading);
  const error = useAppSelector(selectOrderTypesError);
  
  const fetchData = useCallback(() => {
    const params: FetchPaginatedOrderTypesParams = { page, limit, sortBy, sortOrder };
    dispatch(fetchPaginatedOrderTypesThunk(params));
  }, [dispatch, page, limit, sortBy, sortOrder]);
  
  return useMemo(
    () => ({
      orderTypes,
      pagination,
      isLoading,
      error,
      fetchData,
    }),
    [orderTypes, pagination, isLoading, error, fetchData]
  );
};

export default usePaginateOrderTypes;

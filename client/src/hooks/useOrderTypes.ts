import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  fetchAllOrderTypesThunk,
  selectOrderTypes,
  selectOrderTypesError,
  selectOrderTypesLoading, selectOrderTypesPagination,
} from '../features/orderType';

const useOrderTypes = (
  page: number,
  limit: number,
  sortBy: string = 'name',
  sortOrder: string = 'ASC'
) => {
  const dispatch = useAppDispatch();
  
  const orderTypes = useAppSelector(selectOrderTypes);
  const pagination = useAppSelector(selectOrderTypesPagination);
  const isLoading = useAppSelector(selectOrderTypesLoading);
  const error = useAppSelector(selectOrderTypesError);
  
  // Fetch order types on mount and when manually refreshed
  const fetchData = useCallback(() => {
    dispatch(fetchAllOrderTypesThunk({ page, limit, sortBy,  sortOrder: sortOrder as 'ASC' | 'DESC'  }));
  }, [dispatch, page, limit, sortBy, sortOrder]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Manual refresh function
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  return useMemo(
    () => ({
      orderTypes,
      pagination,
      isLoading,
      error,
      refresh, // Function to manually refresh compliance data
    }),
    [orderTypes, pagination, isLoading, error, refresh]
  );
};

export default useOrderTypes;

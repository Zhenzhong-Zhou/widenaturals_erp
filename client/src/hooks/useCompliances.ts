import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  fetchAllCompliancesThunk,
  selectCompliances,
  selectCompliancesPagination, // Ensure correct selector name
  selectCompliancesError,
  selectCompliancesLoading,
} from '../features/compliance';

const useCompliances = (
  page: number,
  limit: number,
  sortBy: string = 'created_at',
  sortOrder: string = 'DESC'
) => {
  const dispatch = useAppDispatch();

  const compliances = useAppSelector(selectCompliances);
  const pagination = useAppSelector(selectCompliancesPagination);
  const loading = useAppSelector(selectCompliancesLoading);
  const error = useAppSelector(selectCompliancesError);

  // Fetch compliances with memoized callback
  const fetchData = useCallback(() => {
    dispatch(
      fetchAllCompliancesThunk({
        page,
        limit,
        sortBy,
        sortOrder: sortOrder as 'ASC' | 'DESC',
      })
    );
  }, [dispatch, page, limit, sortBy, sortOrder]);

  // Fetch compliances when the component mounts or params change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ Manual refresh function
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return useMemo(
    () => ({
      compliances,
      pagination,
      loading,
      error,
      refresh, // Function to manually refresh compliance data
    }),
    [compliances, pagination, loading, error, refresh]
  );
};

export default useCompliances;
